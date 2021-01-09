import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {RxStompService} from '@stomp/ng2-stompjs';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {BehaviorSubject, of, Subscription} from 'rxjs';
import {catchError, mergeMap, takeWhile, timeout} from 'rxjs/operators';
import {environment} from 'src/environments/environment';
import {QueueItem} from '../entities/queue-item';
import {QueueItemDTO} from '../entities/queue-item-dto';
import {User} from '../entities/user';
import {UserType} from '../user-type.enum';
import {OnlineStatusService} from './online-status.service';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly users: User[];

  private readonly rabbitSubscriptions: Map<string, Subscription>[];
  public readonly isReady;
  public readonly user;
  private isOnline = true;

  constructor(
    private readonly http: HttpClient,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly rxStompService: RxStompService,
    private readonly onlineStatusService: OnlineStatusService
  ) {
    onlineStatusService.isOnline.subscribe(
      (isOnline) => (this.isOnline = isOnline)
    );
    this.users = [];
    this.rabbitSubscriptions = [new Map(), new Map()];
    this.isReady = new BehaviorSubject<boolean>(false);
    this.user = new BehaviorSubject<User>(this.users[0]);

    this.initialize();
  }

  private async initialize(): Promise<void> {
    let guest = (await this.indexedDBService
      .getByID('users', UserType.Guest)
      .toPromise()) as User | undefined;
    if (guest === undefined) {
      // create guest
      guest = new User();
      guest.algorithms = User.default_algorithms;
      guest.problems = User.default_problems;
      await this.indexedDBService.add('users', guest).toPromise();
    }
    const user = (await this.indexedDBService
      .getByID('users', UserType.User)
      .toPromise()) as User | undefined;
    Promise.all([this.initializeUser(guest), this.initializeUser(user)])
      .then(() => {
        if (this.users[1] !== undefined) {
          this.user.next(this.users[1]);
        } else if (this.users[0] !== undefined) {
          this.user.next(this.users[0]);
        }
        this.isReady.next(true);
      })
      .catch(() => {
        console.error('Error during initialization!');
      });
  }

  private async initializeUser(
    user: User | undefined
  ): Promise<void> {
    if (user === undefined) {
      return;
    }
    if (user.id === UserType.User) {
      // TODO
      // update the user from backend
      // await this.indexedDBService.update('users', user);
    } else if (user.queue.size !== 0) {
      const queue = Array.from(user.queue.values());
      const updatedQueue = await this.http
        .get<Map<string, QueueItem>>(
          environment.backend +
          environment.urls[UserType.Guest].queue +
          '/' +
          queue
            .map((queueItem) => queueItem.rabbitId)
            .reduce((prev, cur) => `${prev},${cur}`)
        )
        .pipe(
          timeout(1000),
          catchError(() => of(undefined))
        )
        .toPromise();
      if (updatedQueue !== undefined) {
        user.queue = new Map<string, QueueItem>();
        updatedQueue.forEach((queueItem) => {
          queueItem.userId = user.id;
          user.queue.set(queueItem.rabbitId, queueItem);
        });
        await this.indexedDBService.update('users', user).toPromise();
      }
    }

    user.queue.forEach((queueItem: QueueItem) => {
      if (queueItem.status === 'processing') {
        this.addSubscription(queueItem);
      }
    });
    this.users[user.id] = user;
  }

  async addQueueItem(queueItem: QueueItem): Promise<void> {

    const user = this.user.getValue();
    queueItem.status = 'waiting';
    queueItem.referenceSet = queueItem.problem;
    queueItem.userId = user.id;
    if (!this.isOnline) {
      throw new Error('Browser is offline');
    }

    const response = await this.http
      .post<{ rabbitId: string }>(
        environment.backend + environment.urls[user.id].queue,
        new QueueItemDTO(queueItem),
        {observe: 'response'}
      )
      .toPromise();
    if (response.status === 200) {
      queueItem.rabbitId = response.body?.rabbitId ?? '';
      user.queue.set(queueItem.rabbitId, queueItem);
      await this.updateGlobalUser(user);
    } else {
      throw new Error('Something went wrong');
    }
  }

  async processQueueItem(queueItem: QueueItem): Promise<void> {
    const user = this.users[queueItem.userId];
    const response = await this.http
      .put(`${environment.backend + environment.urls[user.id].queue}/${queueItem.rabbitId}`, null, {
        observe: 'response',
      })
      .toPromise();
    if (response.status !== 200) {
      throw new Error('error occured');
    }
    queueItem.status = 'processing';
    queueItem.progress = 0;
    await this.updateGlobalUser(user);
    this.addSubscription(queueItem);
  }

  async cancelProcessing(queueItem: QueueItem): Promise<void> {
    const user = this.users[queueItem.userId];
    const response = await this.http
      .put(
        `${environment.backend + environment.urls[queueItem.userId].queue}/cancel/${
          queueItem.rabbitId
        }`,
        {},
        {observe: 'response'}
      )
      .toPromise();
    if (response.status !== 200) {
      throw new Error('error occured');
    }
    queueItem.status = 'waiting';
    queueItem.progress = -1;
    queueItem.results = [];
    await this.updateGlobalUser(user);
  }

  async removeQueueItem(queueItem: QueueItem): Promise<void> {
    const response = await this.http
      .delete(
        `${environment.urls[queueItem.userId].queue}/${queueItem.rabbitId}`,
        {observe: 'response'}
      )
      .toPromise();
    if (response.status !== 200) {
      throw new Error('error occured');
    }
    this.removeSubscription(queueItem);
    this.users[queueItem.userId].queue.delete(queueItem.rabbitId);
  }

  private async addSubscription(queueItem: QueueItem): Promise<void> {
    const user = this.users[queueItem.userId];
    const rabbitSubscription = this.rxStompService
      .watch(queueItem.rabbitId)
      .pipe(
        mergeMap((response) => {
          console.log('rabbit response');
          console.log(response);
          queueItem.results.push(JSON.parse(response.body));
          return this.updateGlobalUser(user);
        }),
        takeWhile(() => queueItem.numberOfSeeds > queueItem.results.length)
      )
      .subscribe(
        () => {
        },
        () => {
          this.removeSubscription(queueItem);
        },
        () => {
          this.removeSubscription(queueItem);
        }
      );
    this.rabbitSubscriptions[queueItem.userId].set(
      queueItem.rabbitId,
      rabbitSubscription
    );
  }

  private removeSubscription(queueItem: QueueItem): void {
    this.rabbitSubscriptions[queueItem.userId]
      .get(queueItem.rabbitId)
      ?.unsubscribe();
    this.rabbitSubscriptions[queueItem.userId].delete(queueItem.rabbitId);
  }

  private async updateGlobalUser(user: User): Promise<void> {
    await this.indexedDBService.update('users', user).toPromise();
    this.user.next(user);
  }
}

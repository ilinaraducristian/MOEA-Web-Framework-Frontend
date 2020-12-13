import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {User} from '../entities/user';
import {environment} from '../../environments/environment';
import {QueueItem} from '../entities/queue-item';
import {map, mergeMap} from 'rxjs/operators';
import {DatabaseService} from './database.service';
import {RabbitmqService} from './rabbitmq.service';
import {Receiver} from 'rhea-promise';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // tslint:disable-next-line:variable-name
  private _guest: User | null = null;
  private user$ = new BehaviorSubject<User | null>(new User());
  private loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  // tslint:disable-next-line:variable-name
  private _rabbitSubscriptions: {
    queueItem: QueueItem;
    receiver: Receiver;
  }[][] = [[], []];

  constructor(private readonly http: HttpClient,
              private readonly indexedDB: DatabaseService,
              private readonly rabbitmq: RabbitmqService) {
    Promise.all([
      this.initializeGuest(),
      this.initializeUser()
    ]).then(() => {
      if (this._guest === null) {
        return Promise.reject('Guest is null');
      }
      if (this._user === null) {
        this.user$.next(this._guest);
        return Promise.resolve();
      }
      this.user$.next(this._user);
      return Promise.resolve();
    }).catch(error => {
      console.log('error caught in user service constructor');
      console.log(error);
    });
  }

  // tslint:disable-next-line:variable-name
  private _user: User | null = null;

  get user(): Observable<User | null> {
    return this.user$.asObservable();
  }

  get isLoading(): Observable<boolean> {
    return this.loading.asObservable();
  }

  async initializeGuest(): Promise<void> {
    const guest = await this.indexedDB.getByID(UserType.Guest).toPromise() as User;
    if (guest === undefined) {
      const {algorithms, problems} = await this.http.get<{ algorithms: [], problems: [] }>(`${environment.backend}/public`).toPromise();
      this._guest = new User();
      this._guest.algorithms = algorithms;
      this._guest.problems = problems;
      this._guest.referenceSets = problems;
      await this.indexedDB.add(this._guest).toPromise();
      return;
    }
    this._guest = guest;
    await this.updateQueue(this._guest);
  }

  async initializeUser(): Promise<void> {
    const user = await this.indexedDB.getByID(UserType.User).toPromise() as User;
    if (user === undefined) {
      return;
    }
    this._user = user;
    if (this._user.queue.length === 0) {
      return;
    }
    await this.updateQueue(this._user);
  }

  addQueueItem(userType: UserType, queueItem: QueueItem): Promise<void> {
    return this.http.post<string>(environment.urls[userType].queue, queueItem)
      .pipe(
        mergeMap(rabbitId => {
          queueItem.rabbitId = rabbitId;
          if (userType === UserType.Guest) {
            this._guest?.queue.push(queueItem);
          } else {
            this._user?.queue.push(queueItem);
          }
          return this.indexedDB.update(this._user);
        }),
        map(() => {
        })
      )
      .toPromise();
  }

  getQueueItem(userType: UserType, rabbitId: string): Observable<QueueItem> {
    return this.http.get<QueueItem>(`${environment.urls[userType].queue}/${rabbitId}`);
  }

  startQueueItemProcessing(userType: UserType, rabbitId: string): Observable<void> {
    return this.http.post<void>(`${environment.urls[userType].queue}/${rabbitId}`, null);
  }

  cancelQueueItemProcessing(userType: UserType, rabbitId: string): Observable<void> {
    return this.http.post<void>(`${environment.urls[userType].queue}/cancel/${rabbitId}`, null);
  }

  // async getDefaultData(): Promise<void> {
  //   console.log(await this.http.get().toPromise());
  // }

  deleteQueueItem(userType: UserType, rabbitId: string): Observable<void> {
    return this.http.delete<void>(`${environment.urls[userType].queue}/cancel/${rabbitId}`);
  }

  private async updateQueue(user: User): Promise<void> {
    if (user.queue.length === 0) {
      return;
    }
    const processingQueueItems = user.queue.filter(queueItem => queueItem.status === 'processing');
    const rabbitIds = processingQueueItems.map(queueItem => queueItem.rabbitId);
    if (rabbitIds.length === 0) {
      return;
    }
    const notProcessingQueueItems = user.queue.filter(queueItem => queueItem.status !== 'processing');
    const newQueue = await this.http.post<QueueItem[]>(environment.urls[UserType.Guest].queue, rabbitIds).toPromise();
    notProcessingQueueItems.push(...newQueue);
    user.queue = notProcessingQueueItems;
    await this.indexedDB.update(user).toPromise();
    this.rabbitmq.connected.subscribe((isConnected) => {
      if (!isConnected) {
        return;
      }
      newQueue.forEach(async qI => {
        const receiver = await this.rabbitmq.addListener(qI.rabbitId || '', context => {
          qI.results.push(context.message?.body);
          if (qI.results.length === qI.numberOfSeeds) {
            receiver.close();
            const elementIndex = this._rabbitSubscriptions[user.id].findIndex(e => e.queueItem === qI);
            if (elementIndex !== -1) {
              this._rabbitSubscriptions[user.id].splice(elementIndex, 1);
            }
          }
        });
        this._rabbitSubscriptions[user.id].push({queueItem: qI, receiver});
      });
    });
  }

}

export enum UserType {
  Guest = 0,
  User = 1
}

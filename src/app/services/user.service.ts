import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {User} from '../entities/user';
import {environment} from '../../environments/environment';
import {QueueItem} from '../entities/queue-item';
import {map, mergeMap, timeout} from 'rxjs/operators';
import {RxStompService} from '@stomp/ng2-stompjs';
import {Errors} from '../errors';
import {NgxIndexedDBService} from 'ngx-indexed-db';

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
    subscription: Subscription;
  }[][] = [[], []];

  constructor(private readonly http: HttpClient,
              private readonly indexedDB: NgxIndexedDBService,
              private readonly rabbitmq: RxStompService) {
    // loading is true so the user must see a loading screen (app component)
    // check for indexeddb support
    this.checkIndexedDBSupport()
      .then(this.checkIfOnline)
      // .then(() => Promise.all([
      //   this.initializeGuest(),
      //   this.initializeUser()
      // ]))
      .catch((error: Error) => {
        if (error.message in Errors) {
          this._status.next({status: 'error', error: error.message});
        }
      });

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
  private _status: BehaviorSubject<object> = new BehaviorSubject<object>({status: 'loading', error: null});

  // tslint:disable-next-line:variable-name
  private _user: User | null = null;

  get status(): Observable<object> {
    return this._status.asObservable();
  }

  get user(): Observable<User | null> {
    return this.user$.asObservable();
  }

  get isLoading(): Observable<boolean> {
    return this.loading.asObservable();
  }

  async initializeGuest(): Promise<void> {
    const guest = await this.indexedDB.getByID('users', UserType.Guest).toPromise() as User;
    if (guest === undefined) {
      const {algorithms, problems} = await this.http.get<{ algorithms: [], problems: [] }>(`${environment.backend}/public`).toPromise();
      this._guest = new User();
      this._guest.algorithms = algorithms;
      this._guest.problems = problems;
      this._guest.referenceSets = problems;
      await this.indexedDB.add('users', this._guest).toPromise();
      return;
    }
    this._guest = guest;
    await this.updateQueue(this._guest);
  }

  async testFcn(): Promise<any> {
    return this.http.get<User>('localhost:6969')
      .pipe(timeout(1000)).toPromise();
  }

  async initializeUser(): Promise<void> {
    const user = await this.indexedDB.getByID('users', UserType.User).toPromise() as User;
    if (user === undefined) {
      return;
    }
    this._user = user;
    if (this._user.queue.size === 0) {
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
            this._guest?.queue.set(queueItem.rabbitId, queueItem);
          } else {
            this._user?.queue.set(queueItem.rabbitId, queueItem);
          }
          return this.indexedDB.update('users', this._user);
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
    return Promise.resolve();
    //   const serverQueue = new Map<string, QueueItem>();
    //   (await this.http.get<QueueItem[]>(environment.urls[UserType.Guest].queue).toPromise()).forEach(e => {
    //     serverQueue.set(e.rabbitId || '', e);
    //   });
    //   user.queue.forEach(async (value, key) => {
    //     if (!serverQueue.get(key) && value.status === 'waiting') {
    //       await this.addQueueItem(user.id, value);
    //       serverQueue.set(key, value);
    //     }
    //
    //   });
    //   const processingQueueItems = user.queue.filter(queueItem => queueItem.status === 'processing');
    //   const rabbitIds = processingQueueItems.map(queueItem => queueItem.rabbitId);
    //   if (rabbitIds.length === 0) {
    //     return;
    //   }
    //   const notProcessingQueueItems = user.queue.filter(queueItem => queueItem.status !== 'processing');
    //   const newQueue = await this.http.post<QueueItem[]>(environment.urls[UserType.Guest].queue, rabbitIds).toPromise();
    //   notProcessingQueueItems.push(...newQueue);
    //   user.queue = notProcessingQueueItems;
    //   await this.indexedDB.update(user).toPromise();
    //
    //   newQueue.forEach(qI => {
    //     const subscription = this.rabbitmq.watch(qI.rabbitId || '').subscribe(message => {
    //       qI.results.push(message.body);
    //       if (qI.results.length === qI.numberOfSeeds) {
    //         subscription.unsubscribe();
    //         const elementIndex = this._rabbitSubscriptions[user.id].findIndex(e => e.queueItem === qI);
    //         if (elementIndex !== -1) {
    //           this._rabbitSubscriptions[user.id].splice(elementIndex, 1);
    //         }
    //       }
    //     });
    //     this._rabbitSubscriptions[user.id].push({queueItem: qI, subscription});
    //   });
  }

  private checkIndexedDBSupport(): Promise<void> {
    let indexeddbSupport = false;
    indexeddbSupport = true;
    if (!indexeddbSupport) {
      // if no support
      return Promise.reject(new Error(Errors.indexeddb_missing));
    }
    return Promise.resolve();
  }

  private checkIfOnline(): Promise<void> {
    if (!window.navigator.onLine) {
      return Promise.reject();
    }
    return Promise.resolve();
  }
}

export enum UserType {
  Guest = 0,
  User = 1
}

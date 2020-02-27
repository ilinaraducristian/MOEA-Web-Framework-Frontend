import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { RxStompService } from "@stomp/ng2-stompjs";
import { NgxIndexedDBService } from "ngx-indexed-db";
import {
  BehaviorSubject,
  from,
  Observable,
  Subscription,
  throwError
} from "rxjs";
import { flatMap, map, takeWhile, tap } from "rxjs/operators";
import { environment, UserType } from "src/environments/environment";
import { LoginUserDTO } from "../dto/login-user-dto";
import { QueueItemDTO } from "../dto/queue-item-dto";
import { RegisterUserDTO } from "../dto/user-dto";
import { QueueItem } from "../entities/queue-item";
import { RabbitResponse } from "../entities/rabbit-response";
import { User } from "../entities/user";

@Injectable({
  providedIn: "root"
})
export class SessionService implements OnDestroy {
  private jsonHeaders: HttpHeaders;
  private fileHeaders: HttpHeaders;
  private _guest: User = null;
  private _user: User = null;
  private _userOrGuest: User = null;
  private _userSubject = new BehaviorSubject<User>(null);
  private rabbitSubscriptions: {
    subscription: Subscription;
    queueItem: QueueItem;
  }[];

  constructor(
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly rxStompService: RxStompService,
    private readonly http: HttpClient,
    private readonly jwtHelperService: JwtHelperService
  ) {
    this.jsonHeaders = new HttpHeaders({
      "Content-Type": "application/json"
    });
    this.fileHeaders = new HttpHeaders({
      "Content-Type": "multipart/form-data"
    });

    this.rabbitSubscriptions = [];

    // find guest
    this.indexedDBService
      .getByID("users", UserType.Guest)
      .then((guest: User | undefined) => {
        if (guest == undefined) {
          // guest not found, create guest
          return this.createGuest();
        } else {
          // guest found, update queue, listen for queueitem change
          return this.updateGuest(guest);
        }
      })
      .then(() => this.indexedDBService.getByID("users", UserType.User))
      .then((user: User | undefined) => {
        if (user == undefined) return;
        return this.updateUser(user);
      });
  }

  get user() {
    return this._userSubject.asObservable();
  }

  private createGuest() {
    this.http
      .get(`${environment.public}/getProblemsAndAlgorithms`)
      .toPromise()
      .then(response => {
        let guest = {
          id: UserType.Guest,
          username: "guest",
          email: "",
          firstName: "",
          problems: response["problems"],
          algorithms: response["algorithms"],
          queue: []
        };

        return this.indexedDBService.add("users", guest).then(() => {
          this._guest = guest;
          this._userOrGuest = guest;
          this._userSubject.next(this._userOrGuest);
        });
      });
  }

  private updateGuest(guest: User) {
    let resolve;
    if (guest.queue.length == 0) resolve = Promise.resolve();
    else {
      resolve = this.http
        .post<QueueItem[]>(
          `${environment.queues[UserType.Guest]}`,
          guest.queue.map(queueItem => queueItem.rabbitId),
          { headers: this.jsonHeaders }
        )
        .toPromise()
        .then(queue => {
          guest.queue = queue;
          guest.queue
            .filter(queueItem => queueItem.status == "working")
            .forEach(queueItem => {
              this.addRabbitSubscription(queueItem);
            });
        });
    }
    return resolve.then(() => {
      this._guest = guest;
      this._userOrGuest = guest;
      this._userSubject.next(this._userOrGuest);
    });
  }

  /**
   * Upload a problem or an algorithm to backend
   * @param type Must be "problem" or "algorithm"
   * @param file The file that will be uploaded
   */
  uploadFile(type: string, file: File) {
    if (type !== "problem" && type != "algorithm") return;
    let formData = new FormData();
    formData.append("file", file, file.name);
    return this.http
      .put(`${environment.backend}/${type}/upload`, formData, {
        reportProgress: true,
        observe: "events"
      })
      .pipe(
        tap(null, null, () =>
          this._user[`${type}s`].push(file.name.replace(/\.class/, ""))
        )
      );
  }

  private updateUser(user: User) {
    // if token expired return
    try {
      if (this.jwtHelperService.isTokenExpired()) {
        localStorage.removeItem("jwt");
        return Promise.resolve();
      }
    } catch (error) {
      return Promise.resolve();
    }
    return this.http
      .get<QueueItem[]>(`${environment.queues[UserType.User]}`)
      .toPromise()
      .then(queue => {
        if (queue == undefined) return;
        user.queue = queue;
        user.queue
          .filter(queueItem => queueItem.status == "working")
          .forEach(queueItem => {
            this.addRabbitSubscription(queueItem);
          });
        this._user = user;
        this._userOrGuest = user;
        this._userSubject.next(this._userOrGuest);
      })
      .catch(error => console.log(error));
  }

  removeUser() {
    return this.indexedDBService.delete("users", UserType.User).then(() => {
      this._user = null;
      if (this._userOrGuest.id == UserType.User)
        this._userOrGuest = this._guest;
      this._userSubject.next(this._userOrGuest);
    });
  }

  signup(registerUserDTO: RegisterUserDTO) {
    return this.http.post(`${environment.user}/register`, registerUserDTO, {
      headers: this.jsonHeaders
    });
  }

  login(loginUserDTO: LoginUserDTO) {
    return this.http
      .post(`${environment.user}/login`, loginUserDTO, {
        headers: this.jsonHeaders
      })
      .pipe(
        flatMap(response => {
          this._user = {
            id: UserType.User,
            username: response["username"],
            email: response["email"],
            firstName: response["firstName"],
            lastName: response["lastName"],
            problems: response["problems"],
            algorithms: response["algorithms"],
            queue: response["queue"]
          };
          return from(
            this.indexedDBService.update("users", this._user).then(() => {
              this._userOrGuest = this._user;
              this._userSubject.next(this._userOrGuest);
              localStorage.setItem("jwt", response["jwt"]);
            })
          );
        })
      );
  }

  signOut() {
    return from(
      this.indexedDBService.delete("users", UserType.User).then(() => {
        localStorage.removeItem("jwt");
        this._user = null;
        this._userOrGuest = this._guest;
        this._userSubject.next(this._userOrGuest);
      })
    );
  }

  getGuestProblemsAndAlgorithms() {
    return this.http
      .get(`${environment.public}/getProblemsAndAlgorithms`)
      .toPromise();
  }

  addQueueItem(queueItem: QueueItem) {
    let queueItemDTO: QueueItemDTO = {
      name: queueItem.name,
      problem: queueItem.problem,
      algorithm: queueItem.algorithm,
      numberOfEvaluations: queueItem.numberOfEvaluations,
      numberOfSeeds: queueItem.numberOfSeeds
    };
    return this.http
      .post(`${environment.queues[this._user.id]}/addQueueItem`, queueItemDTO, {
        headers: this.jsonHeaders
      })
      .pipe(
        flatMap(response => {
          queueItem.rabbitId = response["rabbitId"];
          this._user.queue.push(queueItem);
          return this.updateUserOrGuest();
        })
      );
  }

  solveQueueItem(queueItem: QueueItem) {
    return this.http
      .get(`${this._user.id}/solveQueueItem/${queueItem.rabbitId}`)
      .pipe(
        flatMap(response => {
          queueItem.solverId = response["solverId"];
          queueItem.status = "working";
          this.addRabbitSubscription(queueItem);
          return this.updateUserOrGuest();
        })
      );
  }

  private cancelQueueItem(queueItem: QueueItem) {
    let request: Observable<any>;
    if (queueItem.status != "working")
      return throwError("QueueItem is not working");
    return this.http
      .get(`${this._user.id}/cancelProblem/${queueItem.solverId}`)
      .pipe(
        flatMap(() => {
          queueItem.solverId = undefined;
          queueItem.status = "waiting";
          return this.updateUserOrGuest();
        })
      );
  }

  removeQueueItem(queueItem: QueueItem) {
    if (queueItem.status == "working") {
      this.http
        .get(`${this._user.id}/cancelProblem/${queueItem.solverId}`)
        .pipe(
          tap(() => {
            queueItem.solverId = undefined;
            queueItem.status = "waiting";
          })
        );
    }
    let foundQueueItemIndex = this._user.queue.findIndex(
      item => queueItem === item
    );
    let foundSubscriptionIndex = this.rabbitSubscriptions.findIndex(
      object => object.queueItem === queueItem
    );
    if (foundSubscriptionIndex != -1) {
      this.rabbitSubscriptions[
        foundSubscriptionIndex
      ].subscription.unsubscribe();
      this.rabbitSubscriptions.splice(foundSubscriptionIndex, 1);
    } else {
      return throwError("Rabbit subscription not found");
    }
    if (foundQueueItemIndex != -1) {
      this._user.queue.splice(foundQueueItemIndex, 1);
      return this.updateUserOrGuest();
    } else {
      return throwError("QueueItem not found");
    }
  }

  addRabbitSubscription(queueItem: QueueItem) {
    let rabbitRoute;
    if (this._user.id == UserType.Guest) {
      rabbitRoute = `guest.${queueItem.rabbitId}`;
    } else {
      rabbitRoute = `user.${this._user.username}.${queueItem.rabbitId}`;
    }
    this.rabbitSubscriptions.push({
      subscription: this.rxStompService
        .watch(rabbitRoute)
        .pipe(
          map(message => JSON.parse(message["body"]) as RabbitResponse),
          takeWhile(message => message.status != "done", true),
          flatMap(message => {
            if (message.error) {
              queueItem.status = "waiting";
              queueItem.solverId = undefined;
              queueItem.progress = undefined;
              queueItem.results = [];
            } else if (message.status == "done") {
              queueItem.status = "done";
              queueItem.solverId = undefined;
              queueItem.progress = undefined;
            } else {
              queueItem.results.push(message);
              queueItem.progress = Math.floor(
                (message.currentSeed / queueItem.numberOfSeeds) * 100
              );
            }
            return this.updateUserOrGuest();
          })
        )
        .subscribe(),
      queueItem
    });
  }

  private updateUserOrGuest() {
    return from(
      this.indexedDBService.update("users", this._userOrGuest).then(() => {
        this._userSubject.next(this._userOrGuest);
      })
    );
  }

  ngOnDestroy() {
    this.rabbitSubscriptions.forEach(object =>
      object.subscription.unsubscribe()
    );
  }
}

import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { RxStompService } from "@stomp/ng2-stompjs";
import { NgxIndexedDBService } from "ngx-indexed-db";
import {
  BehaviorSubject,
  from,
  Observable,
  Subscription,
  throwError
} from "rxjs";
import { flatMap, takeWhile } from "rxjs/operators";
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
  private jsonHeaders: {};
  private _user: User = null;
  private _userSubject = new BehaviorSubject<User>(null);
  private rabbitSubscriptions: {
    subscription: Subscription;
    queueItem: QueueItem;
  }[];

  constructor(
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly rxStompService: RxStompService,
    private readonly http: HttpClient
  ) {
    this.jsonHeaders = {
      "Content-Type": "application/json"
    };

    this.rabbitSubscriptions = [];

    // Create guest user if not found in DB
    this.indexedDBService
      .getByID("users", 0)
      .then((guest: User | undefined) => {
        if (guest == undefined) {
          // create guest
          return this.getGuestProblemsAndAlgorithms()
            .toPromise()
            .then(response => {
              guest = {
                id: UserType.Guest,
                username: "guest",
                email: "",
                firstName: "",
                problems: response["problems"],
                algorithms: response["algorithms"],
                queue: []
              };
            })
            .then(() => this.indexedDBService.add("users", guest))
            .then(() => {
              this._user = guest;
              this._userSubject.next(this._user);
            });
        } else {
          this._user = guest;
          this._userSubject.next(this._user);
        }
      })
      .then(() => this.indexedDBService.getByID("users", 1))
      .then((user: User | undefined) => {
        if (user != undefined) {
          this._user = user;
          this._userSubject.next(this._user);
        }
      })
      .then(() => {
        this._user.queue
          .filter(queueItem => queueItem.status == "working")
          .forEach(queueItem => {
            this.addRabbitSubscription(queueItem);
          });
      });
  }

  get user() {
    return this._userSubject.asObservable();
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
              this._userSubject.next(this._user);
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
        this._userSubject.next(this._user);
      })
    );
  }

  getGuestProblemsAndAlgorithms() {
    return this.http.get(`${environment.public}/getProblemsAndAlgorithms`);
  }

  addQueueItem(queueItem: QueueItem) {
    let queueItemDTO: QueueItemDTO = {
      name: queueItem.name,
      problem: queueItem.problem,
      algorithm: queueItem.algorithm,
      numberOfEvaluations: queueItem.numberOfEvaluations,
      numberOfSeeds: queueItem.numberOfSeeds
    };
    let request: Observable<any>;
    if (this._user.id == UserType.Guest) {
      request = this.http.post(
        `${environment.guestQueue}/addQueueItem`,
        queueItemDTO,
        {
          headers: this.jsonHeaders
        }
      );
    } else {
      request = this.http.post(
        "http://localhost:8080/user/queue/addQueueItem",
        queueItemDTO,
        {
          headers: {
            ...this.jsonHeaders,
            Authorization: `Bearer ${localStorage.getItem("jwt")}`
          }
        }
      );
    }
    return request.pipe(
      flatMap(response => {
        queueItem.rabbitId = response["rabbitId"];
        this._user.queue.push(queueItem);
        return this.updateUser();
      })
    );
  }

  solveQueueItem(queueItem: QueueItem) {
    let request: Observable<any>;
    if (this._user.id == UserType.Guest) {
      request = this.http.get(
        `${environment.guestQueue}/solveQueueItem/${queueItem.rabbitId}`
      );
    } else {
      request = this.http.get(
        `${environment.userQueue}/solveQueueItem/${queueItem.rabbitId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`
          }
        }
      );
    }
    return request.pipe(
      flatMap(response => {
        queueItem.solverId = response["solverId"];
        queueItem.status = "working";
        this.addRabbitSubscription(queueItem);
        return this.updateUser();
      })
    );
  }

  cancelQueueItem(queueItem: QueueItem) {
    let request: Observable<any>;
    if (queueItem.status != "working")
      return throwError("QueueItem is not working");
    if (this._user.id == UserType.Guest) {
      request = this.http.get(
        `${environment.guestQueue}/cancelProblem/${queueItem.solverId}`
      );
    } else {
      request = this.http.get(
        `${environment.userQueue}/cancelProblem/${queueItem.solverId}`
      );
    }
    return request.pipe(
      flatMap(() => {
        queueItem.solverId = undefined;
        queueItem.status = "waiting";
        return this.updateUser();
      })
    );
  }

  removeQueueItem(queueItem: QueueItem) {
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
      return this.updateUser();
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
          takeWhile(message => message["body"] != `{"status":"done"}`, true),
          flatMap(message => {
            let messageBody = JSON.parse(message["body"]) as RabbitResponse;
            if (messageBody.error) {
              queueItem.status = "waiting";
              queueItem.solverId = undefined;
              queueItem.progress = undefined;
              queueItem.results = [];
            } else if (messageBody.status) {
              queueItem.status = "done";
              queueItem.solverId = undefined;
              queueItem.progress = undefined;
            } else {
              queueItem.results.push(messageBody);
              queueItem.progress = Math.floor(
                (messageBody.currentSeed / queueItem.numberOfSeeds) * 100
              );
            }
            return this.updateUser();
          })
        )
        .subscribe(),
      queueItem
    });
  }

  private updateUser() {
    return from(
      this.indexedDBService.update("users", this._user).then(() => {
        this._userSubject.next(this._user);
      })
    );
  }

  ngOnDestroy() {
    this.rabbitSubscriptions.forEach(object =>
      object.subscription.unsubscribe()
    );
  }
}

import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { RxStompService } from "@stomp/ng2-stompjs";
import { BehaviorSubject, Subscription } from "rxjs";
import { flatMap, map, takeWhile, tap } from "rxjs/operators";
import { environment, UserType } from "src/environments/environment";
import { QueueItem } from "../entities/queue-item";
import { RabbitResponse } from "../entities/rabbit-response";
import { User } from "../entities/user";
import { DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root",
})
export class UserManagementService implements OnDestroy {
  private guest: User = null;
  private _user: User = null;
  private userOrGuest = null;

  private userOrGuest$: BehaviorSubject<User> = new BehaviorSubject(null);

  private rabbitSubscriptions: {
    queueItem: QueueItem;
    subscription: Subscription;
  }[][];

  constructor(
    private readonly rxStompService: RxStompService,
    private readonly http: HttpClient,
    private readonly jwtHelperService: JwtHelperService,
    private readonly databaseService: DatabaseService
  ) {
    this.rabbitSubscriptions = [[], []];

    Promise.all([
      databaseService
        .getById(UserType.Guest)
        .then((guest: User | undefined) => {
          if (guest == undefined) {
            return this.createGuest();
          } else {
            this.guest = guest;
            return this.updateGuestQueue();
          }
        }),
      databaseService.getById(UserType.User).then((user: User | undefined) => {
        if (user != undefined) {
          try {
            if (this.jwtHelperService.isTokenExpired()) {
              localStorage.removeItem("jwt");
              return this.databaseService.delete(UserType.User);
            }
          } catch (error) {
            return Promise.resolve();
          }
          this._user = user;
          return this.updateUserQueue();
        }
      }),
    ])
      .then(() => {
        if (this._user) {
          this.userOrGuest = this._user;
        } else {
          this.userOrGuest = this.guest;
        }
        this.userOrGuest$.next(this.userOrGuest);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  private createGuest() {
    let guest = {
      id: UserType.Guest,
      username: "",
      email: "",
      firstName: "",
      problems: environment.problems,
      algorithms: environment.algorithms,
      queue: [],
    };
    return this.databaseService.add(guest).then(() => {
      this.guest = guest;
    });
  }

  private updateGuestQueue() {
    if (this.guest.queue.length == 0) return;
    let body = this.guest.queue.map((queueItem) => queueItem.rabbitId);
    return this.http
      .post<QueueItem[]>(`${environment.queues[UserType.Guest]}`, body)
      .toPromise()
      .then((queue) => {
        this.guest.queue = queue;
        this.guest.queue.forEach((queueItem) => {
          // TODO de ce fac un nou queue pt guest ?
          if (queueItem.status == "working") {
            this.addRabbitSubscription(this.guest, queueItem);
          }
        });
        return this.databaseService.update(this.guest);
      })
      .catch((error) => Promise.resolve());
  }

  private updateUserQueue() {
    return this.http
      .get<QueueItem[]>(`${environment.queues[UserType.User]}`)
      .toPromise()
      .then((queue) => {
        this._user.queue = queue;
        this._user.queue.forEach((queueItem) => {
          if (queueItem.status == "working") {
            this.addRabbitSubscription(this._user, queueItem);
          }
        });
        return this.databaseService.update(this.user);
      })
      .catch((error) => Promise.resolve());
  }

  private addRabbitSubscription(user: User, queueItem: QueueItem) {
    let rabbitRoute;
    if (user.id == UserType.User) {
      rabbitRoute = `user.${user.username}.${queueItem.rabbitId}`;
    } else {
      rabbitRoute = `guest.${queueItem.rabbitId}`;
    }

    const subscription = this.rxStompService
      .watch(rabbitRoute)
      .pipe(
        map((message) => JSON.parse(message["body"]) as RabbitResponse),
        takeWhile((message) => message.status != "done", true),
        flatMap((message) => {
          if (message.error) {
            queueItem.status = "waiting";
            queueItem.progress = undefined;
            queueItem.results = [];
          } else if (message.status == "done") {
            queueItem.status = "done";
            queueItem.progress = undefined;
          } else {
            queueItem.results.push(message);
            queueItem.progress = Math.floor(
              (message.currentSeed / queueItem.numberOfSeeds) * 100
            );
          }

          return this.databaseService.update(user).then(() => {
            if (this.userOrGuest.id == user.id) {
              this.updateUser();
            }
          });
        })
      )
      .subscribe(
        () => {
          // console.log("worked");
        },
        (error) => {
          console.log("UserManagementService: addRabbitSubscription");
          console.log(error);
        }
      );

    this.rabbitSubscriptions[user.id].push({ queueItem, subscription });
  }

  private removeRabbitSubscription(user: User, qI: QueueItem) {
    let found = this.rabbitSubscriptions[user.id].findIndex(
      (value) => value.queueItem === qI
    );
    if (found != -1) {
      this.rabbitSubscriptions[user.id][found].subscription.unsubscribe();
      this.rabbitSubscriptions[user.id].splice(found, 1);
      return this.databaseService.update(user);
    }
    return Promise.reject("QueueItem not found in rabbit subscriptions");
  }

  signup(userInfo) {
    return new Promise((resolve, reject) => {
      this.http
        .post(`${environment.user}/register`, {
          username: userInfo.username,
          password: userInfo.password,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
        })
        .subscribe(
          () => {
            resolve();
          },
          (error) => {
            reject(error);
          }
        );
    });
  }

  login(username: string, password: string) {
    return new Promise((resolve, reject) => {
      this.http
        .post(`${environment.user}/login`, {
          username,
          password,
        })
        .subscribe(
          (response) => {
            localStorage.setItem("jwt", response["jwt"]);
            this._user = {
              id: UserType.User,
              username: response["username"],
              email: response["email"],
              firstName: response["firstName"],
              lastName: response["lastName"],
              problems: response["problems"],
              algorithms: response["algorithms"],
              queue: response["queue"],
            };
            this.updateUserQueue().then;
            this.databaseService.update(this._user).then(() => {
              // TODO update sau add nu stiu, ce se intampla daca nu este in baza de date si dau update
              this.userOrGuest = this._user;
              this.updateUser();
              resolve();
            });
          },
          (error) => {
            reject(error);
          }
        );
    });
  }

  logout() {
    this.rabbitSubscriptions[UserType.User].forEach((value) =>
      value.subscription.unsubscribe()
    );
    localStorage.removeItem("jwt");
    return this.databaseService.delete(UserType.User).then(() => {
      this.userOrGuest = this.guest;
      this._user = null;
      this.updateUser();
    });
  }

  addQueueItem(queueItem: QueueItem) {
    return new Promise((resolve, reject) => {
      this.http
        .post(`${environment.queues[this.userOrGuest.id]}/addQueueItem`, {
          name: queueItem.name,
          problem: queueItem.problem,
          algorithm: queueItem.algorithm,
          numberOfEvaluations: queueItem.numberOfEvaluations,
          numberOfSeeds: queueItem.numberOfSeeds,
        })
        .subscribe(
          (response) => {
            queueItem.rabbitId = response["rabbitId"];
            this.userOrGuest.queue.push(queueItem);
            this.databaseService.update(this.userOrGuest).then(() => {
              this.updateUser();
              resolve();
            });
          },
          (error) => {
            reject(error);
          }
        );
    });
  }

  solveQueueItem(queueItem: QueueItem) {
    if (queueItem.status == "working")
      return Promise.reject("Queue item already working");
    return this.http
      .get(
        `${environment.queues[this.userOrGuest.id]}/solveQueueItem/${
          queueItem.rabbitId
        }`
      )
      .toPromise()
      .then(() => {
        queueItem.status = "working";
        return this.databaseService.update(this.userOrGuest).then(() => {
          this.updateUser();
          this.addRabbitSubscription(this.userOrGuest, queueItem);
        });
      });
  }

  cancelQueueItem(queueItem: QueueItem) {
    if (queueItem.status == "working") {
      console.log("asd");
      return this.http
        .get(
          `${environment.queues[this.userOrGuest.id]}/cancelQueueItem/${
            queueItem.rabbitId
          }`
        )
        .toPromise()
        .then(() =>
          this.removeRabbitSubscription(this.userOrGuest, queueItem).then(
            () => {
              queueItem.progress = undefined;
              queueItem.status = "waiting";
              return this.databaseService.update(this.userOrGuest).then(() => {
                this.updateUser();
              });
            }
          )
        );
    }
    return Promise.reject("QueueItem not working");
  }

  removeQueueItem(queueItem: QueueItem) {
    const foundQueueItemIndex = this.userOrGuest.queue.findIndex(
      (item) => queueItem === item
    );
    if (foundQueueItemIndex == -1) return Promise.resolve();
    return this.http
      .get(
        `${environment.queues[this.userOrGuest.id]}/removeQueueItem/${
          queueItem.rabbitId
        }`
      )
      .toPromise()
      .then(() => {
        let promise;
        if (queueItem.status == "working") {
          promise = this.removeRabbitSubscription(this.userOrGuest, queueItem);
        } else {
          promise = Promise.resolve();
        }
        return promise.then(() => {
          this.userOrGuest.queue.splice(foundQueueItemIndex, 1);
          return this.databaseService.update(this.userOrGuest).then(() => {
            this.updateUser();
          });
        });
      });
  }

  private updateUser() {
    this.userOrGuest$.next(this.userOrGuest);
  }

  get user() {
    return this.userOrGuest$.asObservable();
  }

  /**
   * Upload a problem or an algorithm to backend
   * @param type Must be "problem" or "algorithm"
   * @param file The file that will be uploaded
   */
  uploadFile(type: string, files: File[]) {
    console.log(files);
    if (type !== "problem" && type != "algorithm") return;
    let formData = new FormData();
    formData.append("override", "true");
    formData.append("name", files[0].name);
    if (type == "problem") {
      formData.append("problem", files[0], files[0].name);
      formData.append("reference", files[1], files[1].name);
    } else {
      formData.append("algorithm", files[0], files[0].name);
    }
    return this.http
      .put(`${environment.backend}/${type}/upload`, formData, {
        reportProgress: true,
        observe: "events",
      })
      .pipe(
        tap(null, null, () => {
          this._user[`${type}s`].push(files[0].name.replace(".class", ""));
          // this.updateUser(this._user);
        })
      );
  }

  ngOnDestroy() {
    this.rabbitSubscriptions.forEach((user) => {
      user.forEach((value) => {
        value.subscription.unsubscribe();
      });
    });
  }
}

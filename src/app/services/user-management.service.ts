import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { RxStompService } from "@stomp/ng2-stompjs";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { BehaviorSubject, Subscription } from "rxjs";
import { flatMap, map, takeWhile } from "rxjs/operators";
import { environment, UserType } from "src/environments/environment";
import { QueueItem } from "../entities/queue-item";
import { RabbitResponse } from "../entities/rabbit-response";
import { User } from "../entities/user";

@Injectable({
  providedIn: "root"
})
export class UserManagementService implements OnDestroy {
  private _guest: User = null;
  private _user: User = null;
  private _loggedIn: boolean = false;

  private _user$: BehaviorSubject<User> = new BehaviorSubject(null);
  private _rabbitSubscriptions: {
    queueItem: QueueItem;
    subscription: Subscription;
  }[][];

  constructor(
    private readonly _indexedDBService: NgxIndexedDBService,
    private readonly _rxStompService: RxStompService,
    private readonly _http: HttpClient,
    private readonly _jwtHelperService: JwtHelperService
  ) {
    // this._rxStompService.deactivate();
    this._rabbitSubscriptions = [[], []];
    // check if guest exists
    this._indexedDBService
      .getByID("users", UserType.Guest)
      .then((guest: User | undefined) => {
        if (guest == undefined) {
          // if guest is not present then create
          return this._createGuest();
        } else {
          // if guest is present check if items are still available
          this._guest = guest;
          return this._updateGuestQueue();
        }
      })
      // check if user exists
      .then(() => this._indexedDBService.getByID("users", UserType.User))
      .then((user: User | undefined) => {
        if (user != undefined) {
          // if user is present
          this._user = user;
          return this._updateUserQueue();
        }
      })
      .then(() => {
        if (this._user != null) {
          this._user$.next(this._user);
        } else {
          this._user$.next(this._guest);
        }
      })
      .catch(error => {
        console.log("UserManagementService: constructor");
        console.log(error.message);
      });
  }

  get user() {
    return this._user$.asObservable();
  }

  private _updateUser() {
    if (this._loggedIn) {
      this._user$.next(this._user);
    } else {
      this._user$.next(this._guest);
    }
  }

  private _createGuest() {
    let guest = {
      id: UserType.Guest,
      username: "guest",
      email: "",
      firstName: "",
      problems: [
        "Belegundu",
        "DTLZ1_2",
        "DTLZ2_2",
        "DTLZ3_2",
        "DTLZ4_2",
        "DTLZ7_2",
        "ROT_DTLZ1_2",
        "ROT_DTLZ2_2",
        "ROT_DTLZ3_2",
        "ROT_DTLZ4_2",
        "ROT_DTLZ7_2",
        "UF1",
        "UF2",
        "UF3",
        "UF4",
        "UF5",
        "UF6",
        "UF7",
        "UF8",
        "UF9",
        "UF10",
        "UF11",
        "UF12",
        "UF13",
        "CF1",
        "CF2",
        "CF3",
        "CF4",
        "CF5",
        "CF6",
        "CF7",
        "CF8",
        "CF9",
        "CF10",
        "LZ1",
        "LZ2",
        "LZ3",
        "LZ4",
        "LZ5",
        "LZ6",
        "LZ7",
        "LZ8",
        "LZ9",
        "WFG1_2",
        "WFG2_2",
        "WFG3_2",
        "WFG4_2",
        "WFG5_2",
        "WFG6_2",
        "WFG7_2",
        "WFG8_2",
        "WFG9_2",
        "ZDT1",
        "ZDT2",
        "ZDT3",
        "ZDT4",
        "ZDT5",
        "ZDT6",
        "Binh",
        "Binh2",
        "Binh3",
        "Binh4",
        "Fonseca",
        "Fonseca2",
        "Jimenez",
        "Kita",
        "Kursawe",
        "Laumanns",
        "Lis",
        "Murata",
        "Obayashi",
        "OKA1",
        "OKA2",
        "Osyczka",
        "Osyczka2",
        "Poloni",
        "Quagliarella",
        "Rendon",
        "Rendon2",
        "Schaffer",
        "Schaffer2",
        "Srinivas",
        "Tamaki",
        "Tanaka",
        "Viennet",
        "Viennet2",
        "Viennet3",
        "Viennet4"
      ],
      algorithms: [
        "CMA-ES",
        "NSGAII",
        "NSGAIII",
        "GDE3",
        "eMOEA",
        "eNSGAII",
        "MOEAD",
        "MSOPS",
        "SPEA2",
        "PAES",
        "PESA2",
        "OMOPSO",
        "SMPSO",
        "IBEA",
        "SMS-EMOA",
        "VEGA",
        "DBEA",
        "RVEA",
        "RSO"
      ],
      queue: []
    };
    return this._indexedDBService.add("users", guest).then(() => {
      this._guest = guest;
    });
  }

  private _updateGuestQueue() {
    if (this._guest.queue.length == 0) return;
    let body = this._guest.queue.map(queueItem => queueItem.rabbitId);
    return this._http
      .post<QueueItem[]>(`${environment.queues[UserType.Guest]}`, body)
      .toPromise()
      .then(queue => {
        this._guest.queue = queue.map(queueItem => {
          queueItem.algorithm = queueItem.algorithm["name"];
          queueItem.problem = queueItem.problem["name"];
          if (queueItem.status == "working") {
            // add rabbit subscription to queueItem
            this.addRabbitSubscription(this._guest, queueItem);
          }
          return queueItem;
        });
      });
  }

  private _updateUserQueue() {
    // if token expired return
    try {
      if (this._jwtHelperService.isTokenExpired()) {
        localStorage.removeItem("jwt");
        this._user = null;
        return this._indexedDBService.delete("users", UserType.User);
      }
    } catch (error) {
      this._user = null;
      return;
    }

    return this._http
      .get<QueueItem[]>(`${environment.queues[UserType.User]}`)
      .toPromise()
      .then(queue => {
        this._user.queue = queue;
        this._user.queue.forEach(queueItem => {
          if (queueItem.status == "working") {
            // add rabbit subscription to queueItem
            this.addRabbitSubscription(this._user, queueItem);
          }
        });
      });
  }

  updateUser(user: User) {
    return this._indexedDBService.update("users", user).then(() => {
      if (this.loggedIn) {
        this._user = user;
        this._user$.next(this._user);
      } else {
        this._guest = user;
        this._user$.next(this._guest);
      }
    });
  }

  set loggedIn(loggedIn: boolean) {
    this._loggedIn = loggedIn;
    if (loggedIn) {
      this._user$.next(this._user);
    } else {
      this._user$.next(this._guest);
      if (this._user == null) return;
      this._rabbitSubscriptions[UserType.User].forEach(({ subscription }) => {
        subscription.unsubscribe();
      });
      this._indexedDBService
        .delete("users", UserType.User)
        .then(() => {
          this._user = null;
        })
        .catch(error => {
          console.log("UserManagementService: loggedIn");
          console.log(error);
        });
    }
  }

  addRabbitSubscription(user: User, queueItem: QueueItem) {
    let rabbitRoute;
    if (user.id == UserType.User) {
      rabbitRoute = `user.${this._user.username}.${queueItem.rabbitId}`;
    } else {
      rabbitRoute = `guest.${queueItem.rabbitId}`;
    }
    let subscription = this._rxStompService
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

          return this._indexedDBService.update("users", user).then(() => {
            this._updateUser();
          });
        })
      )
      .subscribe(null, error => {
        console.log("UserManagementService: addRabbitSubscription");
        console.log(error);
      });

    this._rabbitSubscriptions[user.id].push({ queueItem, subscription });
  }

  removeRabbitSubscription(user: User, qI: QueueItem) {
    this._rabbitSubscriptions[user.id]
      .filter(({ queueItem }) => queueItem === qI)
      .forEach(({ subscription }) => subscription.unsubscribe());
    this._rabbitSubscriptions[user.id] = this._rabbitSubscriptions[
      user.id
    ].filter(({ queueItem }) => queueItem !== qI);
    return this._indexedDBService.update("users", user).then(() => {
      this._updateUser();
    });
  }

  /**
   * Upload a problem or an algorithm to backend
   * @param type Must be "problem" or "algorithm"
   * @param file The file that will be uploaded
   */
  // uploadFile(type: string, files: File[]) {
  //   if (type !== "problem" && type != "algorithm") return;
  //   let formData = new FormData();
  //   if (type == "problem") {
  //     formData.append("problem", files[0], files[0].name);
  //     formData.append("reference", files[1], files[1].name);
  //   } else {
  //     formData.append("algorithm", files[0], files[0].name);
  //   }
  //   return this._http
  //     .put(`${environment.backend}/${type}/upload`, formData, {
  //       reportProgress: true,
  //       observe: "events"
  //     })
  //     .pipe(
  //       tap(null, null, () => {
  //         this._user[`${type}s`].push(files[0].name.replace(".class", ""));
  //         this._updateUserOrGuest();
  //       })
  //     );
  // }

  ngOnDestroy() {
    this._rabbitSubscriptions[UserType.Guest].forEach(({ subscription }) => {
      subscription.unsubscribe();
    });
    if (this._user != null)
      this._rabbitSubscriptions[UserType.User].forEach(({ subscription }) =>
        subscription.unsubscribe()
      );
  }
}

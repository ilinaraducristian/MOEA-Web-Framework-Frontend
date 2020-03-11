import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { RxStompService } from "@stomp/ng2-stompjs";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { BehaviorSubject, empty, from, Subscription, throwError } from "rxjs";
import { catchError, flatMap, map, takeWhile, tap } from "rxjs/operators";
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
  private _userOrGuest: User = null;

  private _userSubject = new BehaviorSubject<User>(null);
  private _isBackendOnlineSubject = new BehaviorSubject<boolean>(false);
  private rabbitSubscriptionsSubject = new BehaviorSubject<[]>([]);

  private _rabbitSubscriptions: {
    subscription: Subscription;
    queueItem: QueueItem;
  }[];

  constructor(
    private readonly _indexedDBService: NgxIndexedDBService,
    private readonly _rxStompService: RxStompService,
    private readonly _http: HttpClient,
    private readonly _jwtHelperService: JwtHelperService
  ) {
    this._rabbitSubscriptions = [];
    this._http.get(`${environment.public}`).subscribe(
      () => this._isBackendOnlineSubject.next(true),
      error => {}
    );

    // find guest
    Promise.all([
      this._indexedDBService
        .getByID("users", UserType.Guest)
        .then((guest: User | undefined) => {
          let resolve;
          if (guest == undefined) {
            // guest not found, create guest
            resolve = this._createGuest();
          } else {
            // guest found, update queue, listen for queueitem change
            resolve = this._updateGuest(guest);
          }
          return resolve;
        }),
      this._indexedDBService
        .getByID("users", UserType.User)
        .then((user: User | undefined) => {
          if (user != undefined) {
            return this._updateUser(user);
          }
        })
    ])
      .then(() => {
        if (this._user != null) {
          this._userOrGuest = this._user;
        } else {
          this._userOrGuest = this._guest;
        }
        this._userSubject.next(this._userOrGuest);
      })
      .catch(error => {
        // console.log(error);
      });
  }

  get user() {
    return this._userSubject.asObservable();
  }

  get backendStatus() {
    return this._isBackendOnlineSubject.asObservable();
  }

  get rabbitSubscriptions() {
    return this.rabbitSubscriptionsSubject.asObservable();
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

  private _updateGuest(guest: User) {
    this._guest = guest;
    if (guest.queue.length == 0) return;

    return this._http
      .post<QueueItem[]>(
        `${environment.queues[UserType.Guest]}`,
        guest.queue.map(queueItem => queueItem.rabbitId)
      )
      .pipe(
        catchError(error => {
          // if server is not responding => _isBackendOnlineSubject = false
          return empty();
        })
      )
      .toPromise()
      .then(queue => {
        guest.queue = queue;
        guest.queue.map(queueItem => {
          queueItem.algorithm = queueItem.algorithm["name"];
          queueItem.problem = queueItem.problem["name"];
          return queueItem;
        });
        guest.queue
          .filter(queueItem => queueItem.status == "working")
          .forEach(queueItem => {
            this.addRabbitSubscription(queueItem);
          });
        this._guest = guest;
      });
  }

  private _updateUser(user: User) {
    // if token expired return
    try {
      if (this._jwtHelperService.isTokenExpired()) {
        localStorage.removeItem("jwt");
        return this._indexedDBService.delete("users", UserType.User);
      }
    } catch (error) {
      return;
    }
    this._user = user;
    return this._http
      .get<QueueItem[]>(`${environment.queues[UserType.User]}`)
      .pipe(
        catchError(error => {
          // if server is not responding => _isBackendOnlineSubject = false
          return throwError(error);
        })
      )
      .toPromise()
      .then(queue => {
        if (queue.length == 0) return;
        user.queue = queue;
        user.queue.forEach(queueItem => {
          if (queueItem.status == "working")
            this.addRabbitSubscription(queueItem);
        });
        this._user = user;
      });
  }

  private _updateUserOrGuest() {
    return from(
      this._indexedDBService.update("users", this._userOrGuest).then(() => {
        this._userSubject.next(this._userOrGuest);
      })
    );
  }

  updateUser(user: User) {
    console.log("update user");
    return from(
      this._indexedDBService.update("users", user).then(() => {
        this._userSubject.next(Object.assign({}, user));
      })
    );
  }

  login() {
    this._userOrGuest = this._user;
  }

  removeRabbitSubscription(queueItem: QueueItem) {
    let foundSubscriptionIndex = this._rabbitSubscriptions.findIndex(
      object => object.queueItem === queueItem
    );
    if (foundSubscriptionIndex == -1)
      throw new Error("Rabbit subscription not found");
    this.rabbitSubscriptions[foundSubscriptionIndex].subscription.unsubscribe();
    this._rabbitSubscriptions.splice(foundSubscriptionIndex, 1);
  }

  deleteUser(user: User) {
    return this._indexedDBService.delete("users", user).then(() => {
      this._userOrGuest = this._guest;
      this._updateUserOrGuest();
    });
  }

  addRabbitSubscription(queueItem: QueueItem) {
    let rabbitRoute;
    if (this._userOrGuest.id == UserType.Guest) {
      rabbitRoute = `guest.${queueItem.rabbitId}`;
    } else {
      rabbitRoute = `user.${this._user.username}.${queueItem.rabbitId}`;
    }
    this._rabbitSubscriptions.push({
      subscription: this._rxStompService
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
              console.log(queueItem.progress);
            }
            return this._updateUserOrGuest();
          })
        )
        .subscribe(null, error => {
          console.log(error);
        }),
      queueItem
    });
  }

  /**
   * Upload a problem or an algorithm to backend
   * @param type Must be "problem" or "algorithm"
   * @param file The file that will be uploaded
   */
  uploadFile(type: string, files: File[]) {
    if (type !== "problem" && type != "algorithm") return;
    let formData = new FormData();
    if (type == "problem") {
      formData.append("problem", files[0], files[0].name);
      formData.append("reference", files[1], files[1].name);
    } else {
      formData.append("algorithm", files[0], files[0].name);
    }
    return this._http
      .put(`${environment.backend}/${type}/upload`, formData, {
        reportProgress: true,
        observe: "events"
      })
      .pipe(
        tap(null, null, () => {
          this._user[`${type}s`].push(files[0].name.replace(".class", ""));
          this._updateUserOrGuest();
        })
      );
  }

  ngOnDestroy() {
    this._rabbitSubscriptions.forEach(rabbitSubscription =>
      rabbitSubscription.subscription.unsubscribe()
    );
  }
}

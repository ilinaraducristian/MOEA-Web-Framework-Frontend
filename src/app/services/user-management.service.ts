import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { RxStompService } from "@stomp/ng2-stompjs";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { BehaviorSubject, empty, from, Subscription, throwError } from "rxjs";
import { catchError, flatMap, map, takeWhile, tap } from "rxjs/operators";
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
export class UserManagementService implements OnDestroy {
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
    this.rabbitSubscriptions = [];

    // find guest
    this.indexedDBService
      .getByID("users", UserType.Guest)
      .then((guest: User | undefined) => {
        let response;
        if (guest == undefined) {
          // guest not found, create guest
          response = this.createGuest();
        } else {
          // guest found, update queue, listen for queueitem change
          response = this.updateGuest(guest);
        }
        return response.then(newGuest => {
          this._guest = newGuest;
          this._userOrGuest = newGuest;
          this._userSubject.next(this._userOrGuest);
        });
      })
      .then(() => this.indexedDBService.getByID("users", UserType.User))
      .then((user: User | undefined) => {
        if (user == undefined) return;
        return this.updateUser(user);
      })
      .catch(error => {
        console.log(error);
      });
  }

  get user() {
    return this._userSubject.asObservable();
  }

  private createGuest() {
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
    return this.indexedDBService.add("users", guest).then(() => guest);
  }

  private updateGuest(guest: User) {
    if (guest.queue.length == 0) return Promise.resolve(guest);
    else {
      return this.http
        .post<QueueItem[]>(
          `${environment.queues[UserType.Guest]}`,
          guest.queue.map(queueItem => queueItem.rabbitId)
        )
        .toPromise()
        .then(queue => {
          guest.queue = queue;
          guest.queue
            .filter(queueItem => queueItem.status == "working")
            .forEach(queueItem => {
              this.addRabbitSubscription(queueItem);
            });
          return Promise.resolve(guest);
        });
    }
  }

  private updateUser(user: User) {
    // if token expired return
    try {
      if (this.jwtHelperService.isTokenExpired()) {
        localStorage.removeItem("jwt");
        return this.indexedDBService
          .delete("users", UserType.User)
          .then(() => Promise.reject());
      }
    } catch (error) {
      return Promise.reject();
    }
    return this.http
      .get<QueueItem[]>(`${environment.queues[UserType.User]}`)
      .toPromise()
      .then(queue => {
        user.queue = queue;
        user.queue
          .filter(queueItem => queueItem.status == "working")
          .forEach(queueItem => {
            this.addRabbitSubscription(queueItem);
          });
        this._user = user;
        this._userOrGuest = user;
        this._userSubject.next(this._userOrGuest);
      });
  }

  private updateUserOrGuest() {
    return from(
      this.indexedDBService.update("users", this._userOrGuest).then(() => {
        this._userSubject.next(this._userOrGuest);
      })
    );
  }

  signup(registerUserDTO: RegisterUserDTO) {
    return this.http.post(`${environment.user}/register`, registerUserDTO);
  }

  login(loginUserDTO: LoginUserDTO) {
    return this.http.post(`${environment.user}/login`, loginUserDTO).pipe(
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
    this._user.queue.forEach(queueItem => {
      this.removeQueueItem(queueItem);
    });
    return from(
      this.indexedDBService.delete("users", UserType.User).then(() => {
        localStorage.removeItem("jwt");
        this._user = null;
        this._userOrGuest = this._guest;
        this._userSubject.next(this._userOrGuest);
      })
    ).pipe(catchError(() => empty()));
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
      .post(
        `${environment.queues[this._userOrGuest.id]}/addQueueItem`,
        queueItemDTO
      )
      .pipe(
        flatMap(response => {
          queueItem.rabbitId = response["rabbitId"];
          this._userOrGuest.queue.push(queueItem);
          return this.updateUserOrGuest();
        }),
        catchError(() => empty())
      );
  }

  solveQueueItem(queueItem: QueueItem) {
    return this.http
      .get(
        `${environment.queues[this._userOrGuest.id]}/solveQueueItem/${
          queueItem.rabbitId
        }`
      )
      .pipe(
        flatMap(response => {
          queueItem.solverId = response["solverId"];
          queueItem.status = "working";
          this.addRabbitSubscription(queueItem);
          return this.updateUserOrGuest();
        })
      );
  }

  cancelQueueItem(queueItem: QueueItem) {
    if (queueItem.status != "working")
      return throwError("QueueItem is not working");
    return this.http
      .get(
        `${environment.queues[this._userOrGuest.id]}/cancelQueueItem/${
          queueItem.solverId
        }`
      )
      .pipe(
        flatMap(() => {
          queueItem.solverId = undefined;
          queueItem.progress = undefined;
          queueItem.status = "waiting";
          return this.updateUserOrGuest();
        })
      );
  }

  removeQueueItem(queueItem: QueueItem) {
    if (queueItem.status == "working") {
      this.http
        .get(
          `${environment.queues[this._userOrGuest.id]}/removeQueueItem/${
            queueItem.rabbitId
          }`
        )
        .subscribe();
    }
    let foundQueueItemIndex = this._userOrGuest.queue.findIndex(
      item => queueItem === item
    );
    if (foundQueueItemIndex == -1) return throwError("QueueItem not found");
    let foundSubscriptionIndex = this.rabbitSubscriptions.findIndex(
      object => object.queueItem === queueItem
    );
    if (foundSubscriptionIndex != -1) {
      this.rabbitSubscriptions[
        foundSubscriptionIndex
      ].subscription.unsubscribe();
      this.rabbitSubscriptions.splice(foundSubscriptionIndex, 1);
    }
    this._userOrGuest.queue.splice(foundQueueItemIndex, 1);
    return this.updateUserOrGuest();
  }

  addRabbitSubscription(queueItem: QueueItem) {
    let rabbitRoute;
    if (this._userOrGuest.id == UserType.Guest) {
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
        tap(null, null, () => {
          this._user[`${type}s`].push(file.name.replace(/\.class/, ""));
        })
      );
  }

  getGuestProblemsAndAlgorithms() {
    return this.http
      .get(`${environment.public}/getProblemsAndAlgorithms`)
      .toPromise();
  }

  ngOnDestroy() {
    this.rabbitSubscriptions.forEach(object =>
      object.subscription.unsubscribe()
    );
  }
}

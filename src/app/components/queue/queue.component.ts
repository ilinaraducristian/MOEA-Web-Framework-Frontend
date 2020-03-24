import { HttpClient } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { faPlay, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Subscription } from "rxjs";
import { flatMap } from "rxjs/operators";
import { QueueItem } from "src/app/entities/queue-item";
import { User } from "src/app/entities/user";
import { UserManagementService } from "src/app/services/user-management.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-queue",
  templateUrl: "./queue.component.html",
  styleUrls: ["./queue.component.sass"]
})
export class QueueComponent implements OnInit, OnDestroy {
  faTrash = faTrash;
  faPlay = faPlay;
  faTimes = faTimes;

  user: User;
  serviceAvailable: boolean;

  private subscriptions: Subscription[];
  private rabbitSubscriptions: {
    subscription: Subscription;
    queueItem: QueueItem;
  }[];

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {
    this.subscriptions = [];
    this.rabbitSubscriptions = [];
    this.serviceAvailable = true;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.userManagementService.user.subscribe(user => {
        this.user = user;
      })
    );
  }

  solveQueueItem(queueItem: QueueItem) {
    this.http
      .get(
        `${environment.queues[this.user.id]}/solveQueueItem/${
          queueItem.rabbitId
        }`
      )
      .pipe(
        flatMap((response: { solverId?: string }) => {
          queueItem.solverId = response.solverId;
          queueItem.status = "working";
          return this.userManagementService.updateUser(this.user);
        })
      )
      .subscribe(
        () => {
          this.userManagementService.addRabbitSubscription(
            this.user,
            queueItem
          );
          this.serviceAvailable = true;
        },
        error => {
          this.serviceAvailable = false;
        }
      );
    return false;
  }

  cancelQueueItem(queueItem: QueueItem) {
    if (queueItem.status != "working") {
      // error QueueItem is not working
      return false;
    }
    this.http
      .get(
        `${environment.queues[this.user.id]}/cancelQueueItem/${
          queueItem.solverId
        }`
      )
      .pipe(
        flatMap(() => {
          queueItem.solverId = undefined;
          queueItem.progress = undefined;
          queueItem.status = "waiting";
          return this.userManagementService.removeRabbitSubscription(
            this.user,
            queueItem
          );
        })
      )
      .subscribe(
        () => {
          this.serviceAvailable = true;
        },
        () => {
          this.serviceAvailable = false;
        }
      );
  }

  removeQueueItem(queueItem: QueueItem) {
    this.http
      .get(
        `${environment.queues[this.user.id]}/removeQueueItem/${
          queueItem.rabbitId
        }`
      )
      .pipe(
        flatMap(response => {
          let foundQueueItemIndex = this.user.queue.findIndex(
            item => queueItem === item
          );
          if (foundQueueItemIndex == -1) return;
          return this.userManagementService
            .removeRabbitSubscription(this.user, queueItem)
            .then(() => {
              this.user.queue.splice(foundQueueItemIndex, 1);
              return this.userManagementService.updateUser(this.user);
            });
        })
      )
      .subscribe(
        () => {
          this.serviceAvailable = true;
        },
        () => {
          this.serviceAvailable = false;
        }
      );

    return false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

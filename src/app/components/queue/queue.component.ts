import { Component, OnDestroy, OnInit } from "@angular/core";
import { faPlay, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Subscription } from "rxjs";
import { QueueItem } from "src/app/entities/queue-item";
import { User } from "src/app/entities/user";
import { UserManagementService } from "src/app/services/user-management.service";

@Component({
  selector: "app-queue",
  templateUrl: "./queue.component.html",
  styleUrls: ["./queue.component.sass"],
})
export class QueueComponent implements OnInit, OnDestroy {
  public faTrash = faTrash;
  public faPlay = faPlay;
  public faTimes = faTimes;

  public user: User;
  public serviceAvailable: boolean;

  private subscriptions: Subscription[];

  constructor(private readonly userManagementService: UserManagementService) {
    this.subscriptions = [];
    this.serviceAvailable = true;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.userManagementService.user.subscribe((user) => {
        this.user = user;
      })
    );
  }

  solveQueueItem(queueItem: QueueItem) {
    this.userManagementService
      .solveQueueItem(queueItem)
      .then(() => {
        console.log("ok");
      })
      .catch((error) => {
        console.log(error);
      });
    return false;
  }

  cancelQueueItem(queueItem: QueueItem) {
    if (queueItem.status == "working") {
      this.userManagementService
        .cancelQueueItem(queueItem)
        .then(() => {
          console.log("ok");
        })
        .catch((error) => {
          console.log(error);
        });
      return false;
    }
  }

  removeQueueItem(queueItem: QueueItem) {
    this.userManagementService
      .removeQueueItem(queueItem)
      .then(() => {
        console.log("ok");
      })
      .catch((error) => {
        console.log(error);
      });

    return false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

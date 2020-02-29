import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { faPlay, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Subscription } from "rxjs";
import { QueueItem } from "src/app/entities/queue-item";
import { User } from "src/app/entities/user";
import { UserManagementService } from "src/app/services/user-management.service";

@Component({
  selector: "app-queue",
  templateUrl: "./queue.component.html",
  styleUrls: ["./queue.component.sass"]
})
export class QueueComponent implements OnInit, OnDestroy {
  faTrash = faTrash;
  faPlay = faPlay;
  faTimes = faTimes;

  private subscriptions: Subscription[];
  public user: User;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly router: Router
  ) {
    this.subscriptions = [];
  }

  ngOnInit() {
    this.subscriptions.push(
      this.userManagementService.user.subscribe(user => {
        this.user = user;
      })
    );
  }

  solveQueueItem(queueItem: QueueItem) {
    this.userManagementService.solveQueueItem(queueItem).subscribe();
    return false;
  }

  showResults(queueItem: QueueItem) {
    localStorage.setItem("queueItemRabbitId", queueItem.rabbitId);
    this.router.navigate(["/results"]);
    return false;
  }

  removeQueueItem(queueItem: QueueItem) {
    this.userManagementService.removeQueueItem(queueItem).subscribe();
    return false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

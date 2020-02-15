import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { QueueItem } from "src/app/entities/queue-item";
import { User } from "src/app/entities/user";
import { SessionService } from "src/app/services/session.service";

@Component({
  selector: "app-queue",
  templateUrl: "./queue.component.html",
  styleUrls: ["./queue.component.sass"]
})
export class QueueComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[];
  public user: User;

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {
    this.subscriptions = [];
  }

  ngOnInit() {
    this.subscriptions.push(
      this.sessionService.user.subscribe(user => {
        this.user = user;
      })
    );
  }

  solveQueueItem(queueItem: QueueItem) {
    this.sessionService.solveQueueItem(queueItem).subscribe();
    return false;
  }

  showResults(queueItem: QueueItem) {
    localStorage.setItem("queueItemRabbitId", queueItem.rabbitId);
    this.router.navigate(["/results"]);
    return false;
  }

  removeProblem(queueItem: QueueItem) {
    this.sessionService.removeQueueItem(queueItem).subscribe();
    return false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

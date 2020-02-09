import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { Problem } from "src/app/entities/problem";
import { SessionService } from "src/app/services/session.service";

@Component({
  selector: "app-queue",
  templateUrl: "./queue.component.html",
  styleUrls: ["./queue.component.sass"]
})
export class QueueComponent implements OnInit, OnDestroy {
  public guestProblems: Problem[];
  private subscriptions: Subscription[];

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {
    this.guestProblems = [];
    this.subscriptions = [];
  }

  ngOnInit() {
    this.sessionService.guestProblems.subscribe(guestProblems => {
      this.guestProblems = guestProblems;
    });
  }

  solveProblem(problem: Problem) {
    this.sessionService.solveProblem(problem).subscribe();
    return false;
  }

  showResults(problem: Problem) {
    localStorage.setItem("problemId", `${problem.id}`);
    this.router.navigateByUrl("results");
    return false;
  }

  removeProblem(problem: Problem) {
    this.sessionService.removeProblem(problem).subscribe();
    return false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

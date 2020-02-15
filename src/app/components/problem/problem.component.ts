import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { User } from "src/app/entities/user";
import { SessionService } from "src/app/services/session.service";
import { compareTwoStrings } from "string-similarity";

@Component({
  selector: "app-problem",
  templateUrl: "./problem.component.html",
  styleUrls: ["./problem.component.sass"]
})
export class ProblemComponent implements OnInit, OnDestroy {
  public displayedProblems: string[];
  public selectedProblem: string;

  public displayedAlgorithms: string[];
  public selectedAlgorithm: string;

  public formGroup: FormGroup;
  private subscriptions: Subscription[];

  public user: User;

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {
    this.formGroup = new FormGroup({
      name: new FormControl(""),
      numberOfEvaluations: new FormControl(10000),
      numberOfSeeds: new FormControl(10)
    });

    this.displayedProblems = [];
    this.selectedProblem = "";

    this.displayedAlgorithms = [];
    this.selectedAlgorithm = "";
    this.subscriptions = [];
  }

  ngOnInit() {
    this.subscriptions.push(
      this.sessionService.user.subscribe(user => {
        this.user = user;
        if (user) {
          this.displayedProblems = user.problems;
          this.selectedProblem = user.problems[0];
          this.displayedAlgorithms = user.algorithms;
          this.selectedAlgorithm = user.algorithms[0];
        } else {
          this.displayedProblems = [];
          this.selectedProblem = "";
          this.displayedAlgorithms = [];
          this.selectedAlgorithm = "";
        }
      })
    );
  }

  search(type: string, itemToSearch: string) {
    if (type == "problem") {
      if (itemToSearch.length == 0) {
        this.displayedProblems = this.user.problems;
      } else {
        this.displayedProblems = this.user.problems
          .map(item => [compareTwoStrings(item, itemToSearch), item])
          .sort((a, b) => b[0] - a[0])
          .map(item => item[1])
          .slice(0, 10);
      }
    } else if (type == "algorithm") {
      if (itemToSearch.length == 0) {
        this.displayedAlgorithms = this.user.algorithms;
      } else {
        this.displayedAlgorithms = this.user.algorithms
          .map(item => [compareTwoStrings(item, itemToSearch), item])
          .sort((a, b) => b[0] - a[0])
          .map(item => item[1])
          .slice(0, 10);
      }
    }
    return false;
  }

  select(type: string, item: string) {
    if (type == "problem") {
      this.selectedProblem = item;
    } else if (type == "algorithm") {
      this.selectedAlgorithm = item;
    }
    return false;
  }

  addQueueItem() {
    this.subscriptions.push(
      this.sessionService
        .addQueueItem({
          name: this.formGroup.value.name,
          problem: this.selectedProblem,
          algorithm: this.selectedAlgorithm,
          numberOfEvaluations: this.formGroup.value.numberOfEvaluations,
          numberOfSeeds: this.formGroup.value.numberOfSeeds,
          status: "waiting",
          results: []
        })
        .subscribe(() => {
          this.router.navigate(["/queue"]);
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

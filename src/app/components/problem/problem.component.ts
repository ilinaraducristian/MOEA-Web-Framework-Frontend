import { HttpEventType } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { User } from "src/app/entities/user";
import { SessionService } from "src/app/services/session.service";
import { compareTwoStrings } from "string-similarity";

@Component({
  selector: "app-problem",
  templateUrl: "./problem.component.html",
  styleUrls: ["./problem.component.sass"]
})
export class ProblemComponent implements OnInit, OnDestroy {
  public user: User;
  public formGroup: FormGroup;
  public displayed: {};
  public selected: {};
  public progress: {};

  private files: {};
  private subscriptions: Subscription[];

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {
    this.formGroup = new FormGroup({
      name: new FormControl(""),
      numberOfEvaluations: new FormControl(10000),
      numberOfSeeds: new FormControl(10)
    });

    this.displayed = {};
    this.selected = {};

    this.displayed["problems"] = [];
    this.selected["problem"] = "";

    this.displayed["algorithms"] = [];
    this.selected["algorithm"] = "";
    this.subscriptions = [];

    this.progress = {};

    this.files = {};
  }

  ngOnInit() {
    this.subscriptions.push(
      this.sessionService.user.subscribe(user => {
        this.user = user;
        if (user) {
          this.displayed["problems"] = user.problems;
          this.selected["problem"] = user.problems[0];
          this.displayed["algorithms"] = user.algorithms;
          this.selected["algorithm"] = user.algorithms[0];
        } else {
          this.displayed["problems"] = [];
          this.selected["problem"] = "";
          this.displayed["algorithms"] = [];
          this.selected["algorithm"] = "";
        }
      })
    );
  }

  addFile(type: string, file: File) {
    if (type !== "problem" && type != "algorithm") return;
    this.files[type] = file;
  }

  uploadFile(type: string) {
    if (type !== "problem" && type != "algorithm") return;
    this.sessionService
      .uploadFile(type, this.files[type])
      .pipe(
        filter(event => event != null),
        filter(event => event.type === HttpEventType.UploadProgress)
      )
      .subscribe((event: any) => {
        this.progress[type] = Math.round((100 * event.loaded) / event.total);
      });
  }

  search(type: string, itemToSearch: string) {
    if (type == "problem") {
      if (itemToSearch.length == 0) {
        this.displayed["problems"] = this.user.problems;
      } else {
        this.displayed["problems"] = this.user.problems
          .map(item => [compareTwoStrings(item, itemToSearch), item])
          .sort((a, b) => b[0] - a[0])
          .map(item => item[1])
          .slice(0, 10);
      }
    } else if (type == "algorithm") {
      if (itemToSearch.length == 0) {
        this.displayed["algorithms"] = this.user.algorithms;
      } else {
        this.displayed["algorithms"] = this.user.algorithms
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
      this.selected["problem"] = item;
    } else if (type == "algorithm") {
      this.selected["algorithm"] = item;
    }
    return false;
  }

  addQueueItem() {
    this.subscriptions.push(
      this.sessionService
        .addQueueItem({
          name: this.formGroup.value.name,
          problem: this.selected["problem"],
          algorithm: this.selected["algorithm"],
          numberOfEvaluations: this.formGroup.value.numberOfEvaluations,
          numberOfSeeds: this.formGroup.value.numberOfSeeds,
          status: "waiting",
          results: []
        })
        .subscribe(() => this.router.navigate(["/queue"]))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

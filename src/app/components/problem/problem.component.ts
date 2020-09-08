import { HttpClient, HttpEventType } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { QueueItem } from "src/app/entities/queue-item";
import { User } from "src/app/entities/user";
import { UserManagementService } from "src/app/services/user-management.service";
import { compareTwoStrings } from "string-similarity";

@Component({
  selector: "app-problem",
  templateUrl: "./problem.component.html",
  styleUrls: ["./problem.component.sass"],
})
export class ProblemComponent implements OnInit, OnDestroy {
  public user: User;
  public formGroup: FormGroup;
  public displayed: {};
  public selected: { problem?: string; algorithm?: string };
  public progress: { problem?: number; algorithm?: number };

  private files: { problem: File[]; algorithm: File[] };
  private subscriptions: Subscription[];

  serviceAvailable: boolean;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {
    this.formGroup = new FormGroup({
      name: new FormControl(""),
      numberOfEvaluations: new FormControl(10000),
      numberOfSeeds: new FormControl(10),
    });

    this.displayed = {};
    this.selected = {};
    this.displayed["problems"] = [];
    this.selected["problem"] = "";
    this.displayed["algorithms"] = [];
    this.selected["algorithm"] = "";
    this.subscriptions = [];
    this.progress = {};
    this.files = { problem: [], algorithm: [] };
    this.serviceAvailable = true;
  }

  ngOnInit() {
    // construieste form ul si lista problem lista algoritmi
    this.subscriptions.push(
      this.userManagementService.user.subscribe((user) => {
        this.user = user;
        if (user != null) {
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

  addFile(type: string, files: File[]) {
    if (type !== "problem" && type != "algorithm") return;
    if (type === "problem") {
      this.files[type] = files;
    } else if (type === "algorithm") {
      this.files[type][0] = (files as unknown) as File;
    }
  }

  uploadFile(type: string) {
    // aici arata bine, de revizuit
    if (type !== "problem" && type != "algorithm") return;
    this.userManagementService
      .uploadFile(type, this.files[type])
      .pipe(
        filter((event) => {
          if (event != null) {
            if (event["type"] === HttpEventType.UploadProgress) return true;
            return false;
          }
          return false;
        })
      )
      .subscribe((event: any) => {
        this.progress[type] = Math.round((100 * event.loaded) / event.total);
      });
  }

  addQueueItem() {
    const queueItem: QueueItem = {
      name: this.formGroup.value.name,
      problem: this.selected["problem"],
      algorithm: this.selected["algorithm"],
      numberOfEvaluations: this.formGroup.value.numberOfEvaluations,
      numberOfSeeds: this.formGroup.value.numberOfSeeds,
      status: "waiting",
      results: [],
    };
    this.userManagementService
      .addQueueItem(queueItem)
      .then(() => {
        console.log("ok");
        this.router.navigate(["/queue"]);
      })
      .catch((error) => {
        console.log(error);
      });
    return false;
  }

  search(type: string, itemToSearch: string) {
    if (type == "problem") {
      if (itemToSearch.length == 0) {
        this.displayed["problems"] = this.user.problems;
      } else {
        this.displayed["problems"] = this.user.problems
          .map((item) => [compareTwoStrings(item, itemToSearch), item])
          .sort((a, b) => b[0] - a[0])
          .map((item) => item[1])
          .slice(0, 10);
      }
    } else if (type == "algorithm") {
      if (itemToSearch.length == 0) {
        this.displayed["algorithms"] = this.user.algorithms;
      } else {
        this.displayed["algorithms"] = this.user.algorithms
          .map((item) => [compareTwoStrings(item, itemToSearch), item])
          .sort((a, b) => b[0] - a[0])
          .map((item) => item[1])
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

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

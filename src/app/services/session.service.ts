import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { BehaviorSubject, from } from "rxjs";
import { flatMap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ProblemDTO } from "../dto/problemDTO";
import { Problem } from "../entities/problem";

@Injectable({
  providedIn: "root"
})
export class SessionService {
  private loginHeaders: HttpHeaders;
  private jsonHeaders: HttpHeaders;
  private _guestProblemsArray: Problem[];
  private _guestProblems = new BehaviorSubject([]);

  constructor(
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly http: HttpClient
  ) {
    this.loginHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: "Bearer "
    });
    this.jsonHeaders = new HttpHeaders({
      "Content-Type": "application/json"
    });
    this._guestProblemsArray = [];
    this.indexedDBService
      .getAll("guestProblems")
      .then(guestProblems => {
        this._guestProblemsArray = guestProblems as Problem[];
        this._guestProblems.next(this._guestProblemsArray);
      })
      .catch(error => console.log(error));
  }

  get guestProblems() {
    return this._guestProblems;
  }

  addProblem(problem: Problem) {
    let problemDTO: ProblemDTO = {
      userDefinedName: problem.userDefinedName,
      name: problem.name,
      algorithm: problem.algorithm,
      numberOfEvaluations: problem.numberOfEvaluations,
      numberOfSeeds: problem.numberOfSeeds
    };
    return this.http
      .post(`${environment.guestQueue}/addProblem`, problemDTO, {
        headers: this.jsonHeaders
      })
      .pipe(
        flatMap(response => {
          problem.rabbitId = response["id"];
          return from(
            this.indexedDBService
              .add("guestProblems", problem)
              .then(guestProblemId => {
                return this.indexedDBService.getByID(
                  "guestProblems",
                  guestProblemId
                );
              })
              .then(guestProblem => {
                this._guestProblemsArray.push(guestProblem as Problem);
                this._guestProblems.next(this._guestProblemsArray);
                return Promise.resolve();
              })
          );
        })
      );
  }

  solveProblem(problem: Problem) {
    return this.http
      .get(`${environment.guestQueue}/solveProblem/${problem.rabbitId}`)
      .pipe(
        flatMap(response => {
          problem.solverId = response["solverId"];
          problem.status = "working";
          this._guestProblems.next(this._guestProblemsArray);
          return from(
            this.indexedDBService
              .update("guestProblems", problem)
              .then(() => Promise.resolve())
          );
        })
      );
  }

  updateProblem(problem: Problem) {
    this._guestProblems.next(this._guestProblemsArray);
    return from(
      this.indexedDBService
        .update("guestProblems", problem)
        .then(() => Promise.resolve())
    );
  }

  removeProblem(problem: Problem) {
    let problemIndex = this._guestProblemsArray.findIndex(
      value => value == problem
    );
    return from(
      this.indexedDBService
        .deleteRecord("guestProblems", problem.id)
        .then(() => {
          this._guestProblemsArray.splice(problemIndex, 1);
          this.guestProblems.next(this._guestProblemsArray);
          return Promise.resolve();
        })
    );
  }
}

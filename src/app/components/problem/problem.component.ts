import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { SessionService } from "src/app/services/session.service";
import { compareTwoStrings } from "string-similarity";

@Component({
  selector: "app-problem",
  templateUrl: "./problem.component.html",
  styleUrls: ["./problem.component.sass"]
})
export class ProblemComponent implements OnInit {
  private problems: string[];
  public displayedProblems: string[];
  public selectedProblem: string;

  private algorithms: string[];
  public displayedAlgorithms: string[];
  public selectedAlgorithm: string;

  public formGroup: FormGroup;
  private results = [];
  private tempChartIndex = false;

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {
    this.formGroup = new FormGroup({
      userDefinedName: new FormControl(""),
      numberOfEvaluations: new FormControl(10000),
      numberOfSeeds: new FormControl(10)
    });

    this.problems = [
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
    ];

    this.algorithms = [
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
    ];

    this.displayedProblems = this.problems;
    this.selectedProblem = this.problems[0];

    this.displayedAlgorithms = this.algorithms;
    this.selectedAlgorithm = this.algorithms[0];
  }

  ngOnInit() {}

  search(type: string, itemToSearch: string) {
    if (type == "problem") {
      if (itemToSearch.length == 0) {
        this.displayedProblems = this.problems;
      } else {
        this.displayedProblems = this.problems
          .map(item => [compareTwoStrings(item, itemToSearch), item])
          .sort((a, b) => b[0] - a[0])
          .map(item => item[1])
          .slice(0, 10);
      }
    } else if (type == "algorithm") {
      if (itemToSearch.length == 0) {
        this.displayedAlgorithms = this.algorithms;
      } else {
        this.displayedAlgorithms = this.algorithms
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

  addToQueue() {
    this.sessionService
      .addProblem({
        userDefinedName: this.formGroup.value.userDefinedName,
        name: this.selectedProblem,
        algorithm: this.selectedAlgorithm,
        numberOfEvaluations: this.formGroup.value.numberOfEvaluations,
        numberOfSeeds: this.formGroup.value.numberOfSeeds,
        results: [],
        status: "waiting"
      })
      .subscribe(() => {
        this.router.navigateByUrl("queue");
      });
  }
}

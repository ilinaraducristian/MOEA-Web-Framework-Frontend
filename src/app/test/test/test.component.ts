import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { RxStompService } from "@stomp/ng2-stompjs";
import { Chart } from "chart.js";
import { SolverService } from "src/app/services/solver.service";
import { compareTwoStrings } from "string-similarity";

@Component({
  selector: "app-test",
  templateUrl: "./test.component.html",
  styleUrls: ["./test.component.sass"]
})
export class TestComponent implements OnInit {
  private problems: string[];
  public displayedProblems: string[];
  public selectedProblem: string;

  private algorithms: string[];
  public displayedAlgorithms: string[];
  public selectedAlgorithm: string;

  public formGroup: FormGroup;
  private chart: Chart;
  private results = [];
  private tempChartIndex = false;

  @ViewChild("graph", { static: true }) context;

  constructor(
    private readonly solverService: SolverService,
    private readonly rxStompService: RxStompService
  ) {
    this.formGroup = new FormGroup({
      numberOfEvaluations: new FormControl(10000),
      numberOfSeeds: new FormControl(10)
    });
    this.problems = [
      "Belegundu",
      "Binh2",
      "Binh3",
      "Binh4",
      "Binh",
      "Fonseca2",
      "Fonseca",
      "Jimenez",
      "Kita",
      "Kursawe",
      "Laumanns",
      "Lis",
      "Murata",
      "Obayashi",
      "OKA1",
      "OKA2",
      "Osyczka2",
      "Osyczka",
      "package-info",
      "Poloni",
      "Quagliarella",
      "Rendon2",
      "Rendon",
      "Schaffer2",
      "Schaffer",
      "Srinivas",
      "Tamaki",
      "Tanaka",
      "Viennet2",
      "Viennet3",
      "Viennet4",
      "Viennet"
    ];

    this.algorithms = [
      "AbstractAlgorithm",
      "AbstractEvolutionaryAlgorithm",
      "AdaptiveTimeContinuation",
      "AlgorithmException",
      "AlgorithmInitializationException",
      "AlgorithmTerminationException",
      "Checkpoints",
      "CMAES",
      "DBEA",
      "EpsilonMOEA",
      "EpsilonProgressContinuation",
      "GDE3",
      "IBEA",
      "MOEAD",
      "MSOPS",
      "MSOPSRankedPopulation",
      "NSGAII",
      "package-info",
      "PAES",
      "PeriodicAction",
      "PESA2",
      "RandomSearch",
      "ReferencePointNondominatedSortingPopulation",
      "ReferenceVectorGuidedPopulation",
      "RestartEvent",
      "RestartListener",
      "RestartType",
      "RVEA",
      "SMSEMOA",
      "SPEA2",
      "StandardAlgorithms",
      "VEGA"
    ];

    this.displayedProblems = this.problems;
    this.selectedProblem = this.problems[0];

    this.displayedAlgorithms = this.algorithms;
    this.selectedAlgorithm = this.algorithms[0];
  }

  ngOnInit() {
    this.chart = new Chart(this.context.nativeElement, {
      type: "line",
      data: {
        datasets: this.results
      },
      options: {
        legend: {
          position: "bottom",
          labels: {
            filter: (item, chart) => {
              if (this.tempChartIndex) return false;
              this.tempChartIndex = true;
              return true;
            }
          }
        },
        responsive: true,
        scales: {
          xAxes: [
            {
              type: "linear"
              // position: "bottom",
              // ticks: {
              //   max: 11000
              // }
            }
          ]
        }
      }
    });
  }

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
    // this.solverService
    //   .addToQueue({
    //     userDefinedName: "Problema 1",
    //     name: this.selectedProblem,
    //     algorithm: this.selectedAlgorithm,
    //     numberOfEvaluations: this.formGroup.value.numberOfEvaluations,
    //     numberOfSeeds: this.formGroup.value.numberOfSeeds
    //   })
    // .pipe(
    //   tap(response => {
    //     this.rxStompService
    //       .watch(`guest.${response["id"]}`)
    //       .subscribe(results => console.log(results.body));
    //   }),
    //   flatMap(response => {
    //     return this.solverService.solveProblem(response["id"]);
    //   })
    // )
    // .subscribe(solverId => console.log(solverId));
    this.solverService
      .addToQueue({
        userDefinedName: "Problema 1",
        name: "Belegundu",
        algorithm: "CMA-ES",
        numberOfEvaluations: this.formGroup.value.numberOfEvaluations,
        numberOfSeeds: this.formGroup.value.numberOfSeeds
      })
      .subscribe(response => {
        this.rxStompService
          .watch(`guest.${response["id"]}`)
          .subscribe(message => {
            let responseBody = JSON.parse(message.body);
            // TODO responseBody.error
            if (responseBody.status != "done") {
              this.results.push({
                label: "R2 Indicator",
                data: responseBody.r2Indicator.map((value, index) => {
                  return { x: (index + 1) * 100, y: value };
                }),
                fill: false,
                borderColor: "rgba(255, 0, 0, .3)",
                pointRadius: 0
              });
              this.tempChartIndex = false;
              this.chart.update();
            }
          });
        this.solverService
          .solveProblem(response["id"])
          .subscribe(solverId => console.log(solverId));
      });
  }
}

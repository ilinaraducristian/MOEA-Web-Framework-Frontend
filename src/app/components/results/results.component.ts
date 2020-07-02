import { Component, OnDestroy, OnInit } from "@angular/core";
import * as Chart from "chart.js";
import { Subscription } from "rxjs";
import { QueueItem } from "src/app/entities/queue-item";
import { UserManagementService } from "src/app/services/user-management.service";

@Component({
  selector: "app-results",
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.sass"],
})
export class ResultsComponent implements OnInit, OnDestroy {
  private chart: Chart;
  private chartDatasets: any[];

  private colors: Colors;
  private chartLabels: any[];
  private chartOptions;
  private datasetOptions;
  private userSubscription: Subscription;

  public qualityIndicators: {
    id: string;
    name: string;
    selected: boolean;
  }[];
  public queueItems: (QueueItem & { selected: boolean; color: any })[];

  constructor(private readonly userManagementService: UserManagementService) {
    this.qualityIndicators = [
      {
        name: "Hypervolume",
        id: "hypervolume",
        selected: false,
      },
      {
        name: "Generational Distance",
        id: "generationalDistance",
        selected: false,
      },
      {
        name: "Inverted Generational Distance",
        id: "invertedGenerationalDistance",
        selected: false,
      },
      { name: "Spacing", id: "spacing", selected: false },
      {
        name: "Additive Epsilon Indicator",
        id: "additiveEpsilonIndicator",
        selected: false,
      },
      {
        name: "Contribution",
        id: "contribution",
        selected: false,
      },
      {
        name: "R1 Indicator",
        id: "r1Indicator",
        selected: false,
      },
      {
        name: "R2 Indicator",
        id: "r2Indicator",
        selected: false,
      },
      {
        name: "R3 Indicator",
        id: "r3Indicator",
        selected: false,
      },
      {
        name: "Elapsed Time",
        id: "elapsedTime",
        selected: false,
      },
      {
        name: "Number of evaluations",
        id: "nfe",
        selected: false,
      },
    ];
    this.chartOptions = {
      elements: {
        line: {
          //tension: 0, // disables bezier curves
        },
      },
      animation: {
        duration: 0,
      },
      hover: {
        animationDuration: 0,
      },
      responsiveAnimationDuration: 0,
      legend: {
        position: "bottom",
        labels: {
          filter: (legendItem) => legendItem.text != undefined,
        },
      },
      responsive: true,
      scales: {
        ticks: {
          maxRotation: 0,
          sampleSize: 0,
        },
        xAxes: [
          {
            // type: "linear",
            scaleLabel: {
              display: true,
              labelString: "Number of evaluations",
              fontSize: 20,
              fontStyle: "bold",
            },
          },
        ],
        yAxes: [
          {
            type: "linear",
            scaleLabel: {
              display: true,
              labelString: "Value",
              fontSize: 20,
              fontStyle: "bold",
            },
          },
        ],
      },
    };
    this.datasetOptions = {
      borderWidth: 0.5,
      lineTension: 0,
      fill: false,
      pointRadius: 0,
      pointHitRadius: 5,
    };
    this.chartLabels = [0];
    this.chartDatasets = [];
    this.queueItems = [];
    this.colors = new Colors();
  }

  ngOnInit() {
    this.chart = new Chart("chart", {
      type: "line",
      data: {
        labels: this.chartLabels,
        datasets: this.chartDatasets,
      },
      options: this.chartOptions,
    });

    this.userSubscription = this.userManagementService.user.subscribe(
      (user) => {
        // this.chartDatasets = [];
        // this.queueItems = [];
        if (user == null) {
          return;
        }

        if (this.queueItems.length == 0) {
          console.log("odata");
          user.queue.forEach((value) => {
            const queueItem = Object.assign(value, {
              selected: false,
              color: this.colors.color,
            });
            this.queueItems.push(queueItem);
            const legendDataset = {
              label: queueItem.name,
              hidden: true,
              borderColor: queueItem.color,
              queueItem,
            };
            this.chartDatasets.push(legendDataset);
            if (queueItem.results[0] != undefined) {
              this.updateLabels(queueItem.results[0].nfe);
              for (const result of queueItem.results) {
                this.addNewResult(result, queueItem);
              }
            }
            this.colors.next;
          });
        } else {
          console.log(this.queueItems);
          // this.queueItems.forEach((queueItem, i) => {
          //   console.log(queueItem.results);
          //   // console.log(user.queue[i].results.length);
          //   if (queueItem.results.length < user.queue[i].results.length) {
          //     console.log("asd");
          //     for (
          //       let j = queueItem.results.length;
          //       j < user.queue[i].results.length;
          //       j++
          //     ) {
          //       const newResult = user.queue[i].results[j];
          //       queueItem.results.push(newResult);
          //       this.addNewResult(newResult, queueItem);
          //       console.log(newResult);
          //     }
          //   }
          // });
          // this.updateChart();
        }
      }
    );
  }

  /**
   * Update x labels based on the new nfe.
   * @param nfe Number of evaluations
   */
  updateLabels(nfe) {
    if (nfe.length >= this.chartLabels.length) {
      const size = nfe.length - this.chartLabels.length + 1;
      const labels = new Array(size)
        .fill(0)
        .map((_, i) => (this.chartLabels.length + i) * 100);
      this.chartLabels = this.chartLabels.concat(labels);
    }
  }

  addNewResult(result, queueItem) {
    const resultKeys = Object.keys(result);
    for (const qualityIndicatorName of resultKeys) {
      if (qualityIndicatorName == "currentSeed") continue;
      const qualityIndicator = this.qualityIndicators.find(
        (val) => val.id == qualityIndicatorName
      );

      const newDataset = Object.assign(
        {
          borderColor: queueItem.color,
          hidden: !(queueItem.selected && qualityIndicator.selected),
          data: [null].concat(result[qualityIndicatorName]),
          queueItem,
          qualityIndicator,
        },
        this.datasetOptions
      );
      this.chartDatasets.push(newDataset);
    }
  }

  // createDataset() {
  //   for (const queueItem of this.queueItems) {
  //     let nfe: any = queueItem.results[0].nfe;
  //     nfe = nfe[nfe.length - 1];

  //     if (nfe > this.chartLabels[this.chartLabels.length - 1]) {
  //       // if nfe > last label

  //       const size =
  //         (nfe - this.chartLabels[this.chartLabels.length - 1]) / 100;
  //       const labels = new Array(size)
  //         .fill(0)
  //         .map(
  //           (val, i) =>
  //             this.chartLabels[this.chartLabels.length - 1] + (i + 1) * 100
  //         );
  //       this.chartLabels = this.chartLabels.concat(labels);
  //     }
  //     const legendDataset = {
  //       label: queueItem.name,
  //       hidden: true,
  //       borderColor: this.colors.color,
  //       queueItem,
  //     };
  //     this.chartDatasets.push(legendDataset);

  //     for (const result of queueItem.results) {
  //       this.addNewResult(result, queueItem);
  //     }
  //     this.colors.next;
  //   }
  //   this.updateChart();
  // }

  // updateChartDatasets() {
  //   for (const queueItem of this.queueItems) {
  //     let nfe: any = queueItem.results[0].nfe;
  //     nfe = nfe[nfe.length - 1];

  //     if (nfe > this.chartLabels[this.chartLabels.length - 1]) {
  //       // if nfe > last label

  //       const size =
  //         (nfe - this.chartLabels[this.chartLabels.length - 1]) / 100;
  //       const labels = new Array(size)
  //         .fill(0)
  //         .map(
  //           (val, i) =>
  //             this.chartLabels[this.chartLabels.length - 1] + (i + 1) * 100
  //         );
  //       this.chartLabels = this.chartLabels.concat(labels);
  //     }

  //     let i = 0;
  //     for (const result of queueItem.results) {
  //       let label;
  //       if (i == 0) {
  //         label = queueItem.name;
  //       }
  //       const resultKeys = Object.keys(result);
  //       for (const qualityIndicatorName of resultKeys) {
  //         if (qualityIndicatorName == "currentSeed") continue;
  //         const qualityIndicator = this.qualityIndicators.find(
  //           (val) => val.id == qualityIndicatorName
  //         );

  //         const newDataset = Object.assign(
  //           {
  //             label: queueItem.name,
  //             borderColor: this.colors.color,
  //             hidden: true,
  //             data: [null].concat(result[qualityIndicatorName]),
  //             queueItem,
  //             qualityIndicator,
  //           },
  //           this.datasetOptions
  //         );
  //         this.chartDatasets.push(newDataset);
  //       }
  //       i++;
  //       this.updateChart();
  //       return;
  //     }
  //     this.colors.next;
  //   }
  // }

  // updateChartDatasets(user: User) {
  //   this.chartLabels = [];
  //   user.queue.forEach((queueItem) => {
  //     let qI = Object.assign({ selected: false }, queueItem);
  //     this.queueItems.push(qI);

  //     this.chartDatasets.push({
  //       label: queueItem.name,

  //       // fill: false,
  //       borderColor: this.colors.color,
  //       // pointRadius: 0,
  //       // borderWidth: 0.5,
  //       hidden: true,
  //       queueItem: qI,
  //     });
  //     this.qualityIndicators.forEach((qualityIndicator) => {
  //       queueItem.results.forEach((result) => {
  //         this.chartDatasets.push({
  //           data: result[qualityIndicator.id].map((result, index) => ({
  //             x: (index + 1) * 100,
  //             y: result,
  //           })),
  //           fill: false,
  //           borderColor: this.colors.color,
  //           pointRadius: 0,
  //           borderWidth: 0.5,
  //           hidden: true,
  //           queueItem: qI,
  //           qualityIndicator,
  //         });
  //       });
  //     });
  //     this.colors.next;
  //   });
  //   this.chart.data.datasets = this.chartDatasets;
  //   this.chart.update();
  // }

  updateChart() {
    if (!this.chart) {
      return;
    }
    this.chart.data.labels = this.chartLabels;
    for (const dataset of this.chartDatasets) {
      if (dataset.qualityIndicator == undefined) {
        dataset.hidden = !dataset.queueItem.selected;
      } else {
        dataset.hidden = !(
          dataset.queueItem.selected && dataset.qualityIndicator.selected
        );
      }
    }
    this.chart.update();
    // run(this.updateChartCoroutine(this.chartDatasets), 100).then(() => {
    //   this.chart.update();
    // });
  }

  updateChartCoroutine(chartDatasets) {
    return function* () {
      for (const dataset of chartDatasets) {
        if (dataset.qualityIndicator == undefined) {
          dataset.hidden = !dataset.queueItem.selected;
        } else {
          dataset.hidden = !(
            dataset.queueItem.selected && dataset.qualityIndicator.selected
          );
        }
        yield;
      }
    };
  }

  selectQueueItem(queueItem: QueueItem & { selected: boolean; dataset: any }) {
    queueItem.selected = !queueItem.selected;
    if (
      this.qualityIndicators.filter(
        (qualityIndicator) => qualityIndicator.selected
      ).length > 0
    )
      this.updateChart();
    return false;
  }

  selectQualityIndicator(qualityIndicator) {
    qualityIndicator.selected = !qualityIndicator.selected;
    if (this.queueItems.filter((queueItem) => queueItem.selected).length > 0)
      this.updateChart();
    return false;
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }
}

class Colors {
  private _colors = [
    "rgba(255, 0, 0, 1)",
    "rgba(0, 255, 0, 1)",
    "rgba(0, 0, 255, 1)",
    "rgba(255, 255, 0, 1)",
    "rgba(255, 0, 255, 1)",
    "rgba(0, 255, 255, 1)",
    "rgba(255, 255, 255, 1)",
  ];
  private _colorIndex = 0;
  private _color = "rgba(255, 0, 0, 1)";

  get color() {
    return this._color;
  }

  get next() {
    this._colorIndex++;
    if (this._colorIndex == this._colors.length) this._colorIndex = 0;
    this._color = this._colors[this._colorIndex];
    return this._color;
  }
}

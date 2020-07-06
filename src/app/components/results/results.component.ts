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

  private initialized = false;

  public qualityIndicators: GraphQualityIndicator[];
  public queueItems: GraphQueueItem[];

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
      borderWidth: 0.2,
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
        if (user == null) {
          return;
        }

        if (this.queueItems.length == 0) {
          user.queue.forEach((value) => {
            const queueItem = Object.assign(value, {
              selected: false,
              color: this.colors.color,
            });
            this.queueItems.push(queueItem);
            this.colors.next;
            this.updateLabels(value.numberOfEvaluations / 100);
            this.updateChart();
          });
          this.initialized = true;
        } else {
          this.chartDatasets = [];
          for (const queueItem of this.queueItems) {
            const qualityIndicatorSelected =
              this.qualityIndicators.filter(
                (qualityIndicator) => qualityIndicator.selected
              ).length > 0;
            if (!(queueItem.selected && qualityIndicatorSelected)) continue;
            const legendDataset = {
              label: queueItem.name,
              borderColor: queueItem.color,
              backgroundColor: queueItem.color,
            };
            this.chartDatasets.push(legendDataset);
            if (queueItem.results[0] != undefined) {
              this.updateLabels(queueItem.results[0].nfe);
              queueItem.results.forEach((result) => {
                this.addNewResult(result, queueItem);
              });
            }
          }

          this.updateChart();
        }
      }
    );
  }

  /**
   * Update x labels based on the new nfe.
   * @param nfe Number of evaluations
   */
  updateLabels(nfe) {
    if (nfe >= this.chartLabels.length) {
      const size = nfe - this.chartLabels.length + 1;
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
      if (
        !this.qualityIndicators.find((val) => val.id == qualityIndicatorName)
          .selected
      )
        continue;
      const newDataset = Object.assign(
        {
          borderColor: queueItem.color,
          hidden: false,
          data: [null].concat(result[qualityIndicatorName]),
        },
        this.datasetOptions
      );
      this.chartDatasets.push(newDataset);
    }
  }

  updateChart() {
    if (!this.chart) {
      return;
    }
    this.chart.data.labels = this.chartLabels;
    this.chartDatasets = [];

    for (const queueItem of this.queueItems) {
      const qualityIndicatorSelected =
        this.qualityIndicators.filter(
          (qualityIndicator) => qualityIndicator.selected
        ).length > 0;
      if (!(queueItem.selected && qualityIndicatorSelected)) continue;
      const legendDataset = {
        label: queueItem.name,
        borderColor: queueItem.color,
        backgroundColor: queueItem.color,
      };
      this.chartDatasets.push(legendDataset);
      queueItem.results.forEach((result) => {
        this.addNewResult(result, queueItem);
      });
    }
    this.chart.data.datasets = this.chartDatasets;
    this.chart.update();
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

  selectQueueItem(queueItem: GraphQueueItem) {
    if (!this.initialized) return false;
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
    if (!this.initialized) return false;
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
  private alpha = 1;
  private _colors = [
    `rgba(255, 0, 0, ${this.alpha})`,
    `rgba(0, 255, 0, ${this.alpha})`,
    `rgba(0, 0, 255, ${this.alpha})`,
    `rgba(255, 255, 0, ${this.alpha})`,
    `rgba(255, 0, 255, ${this.alpha})`,
    `rgba(0, 255, 255, ${this.alpha})`,
    `rgba(255, 255, 255, ${this.alpha})`,
  ];
  private _colorIndex = 0;
  private _color = this._colors[0];

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

type GraphQueueItem = QueueItem & { selected: boolean; color: any };
type GraphQualityIndicator = {
  id: string;
  name: string;
  selected: boolean;
};

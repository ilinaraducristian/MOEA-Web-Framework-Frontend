import { Component, OnDestroy, OnInit } from "@angular/core";
import * as Chart from "chart.js";
import { Subscription } from "rxjs";
import { QualityIndicators } from "src/app/entities/quality-indicators";
import { QueueItem } from "src/app/entities/queue-item";
import { UserManagementService } from "src/app/services/user-management.service";

@Component({
  selector: "app-results",
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.sass"],
})
export class ResultsComponent implements OnInit, OnDestroy {
  private chart: Chart;
  private chartOptions: Chart.ChartOptions;
  private datasetOptions: Chart.ChartDataSets;
  private chartDatasets: Chart.ChartDataSets[];
  private chartLabels: number[];

  private colors: Colors;
  private userSubscription: Subscription;
  private initialized = false;

  public qualityIndicators: GraphQualityIndicator;
  public queueItems: GraphQueueItem[];

  constructor(private readonly userManagementService: UserManagementService) {
    this.qualityIndicators = {
      hypervolume: {
        name: "Hypervolume",
        selected: false,
      },
      generationalDistance: {
        name: "Generational Distance",
        selected: false,
      },
      invertedGenerationalDistance: {
        name: "Inverted Generational Distance",
        selected: false,
      },
      spacing: {
        name: "Spacing",
        selected: false,
      },
      additiveEpsilonIndicator: {
        name: "Additive Epsilon Indicator",
        selected: false,
      },
      contribution: {
        name: "Contribution",
        selected: false,
      },
      r1Indicator: {
        name: "R1 Indicator",
        selected: false,
      },
      r2Indicator: {
        name: "R2 Indicator",
        selected: false,
      },
      r3Indicator: {
        name: "R3 Indicator",
        selected: false,
      },
      elapsedTime: {
        name: "Elapsed Time",
        selected: false,
      },
      nfe: {
        name: "Number of evaluations",
        selected: false,
      },
    };
    this.chartOptions = {
      elements: {
        line: {
          tension: 0,
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
    this.chartDatasets = [];
    this.chartLabels = [0];
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

        if (!this.initialized) {
          user.queue.forEach((value) => {
            const queueItem = Object.assign(value, {
              selected: false,
              color: this.colors.color,
            });
            this.queueItems.push(queueItem);
            this.colors.next;
          });
          this.initialized = true;
        }
        this.updateChart();
      }
    );
  }

  /**
   * Update x axis labels based on the new nfe.
   * @param nfe Number of evaluations
   */
  updateLabels(nfe: number) {
    if (nfe >= this.chartLabels.length) {
      const size = nfe - this.chartLabels.length + 1;
      const labels = new Array(size)
        .fill(0)
        .map((_, i) => (this.chartLabels.length + i) * 100);
      this.chartLabels = this.chartLabels.concat(labels);
    }
  }

  /**
   * Creates a new chart dataset from the given result.
   * @param color Dataset color inherited from Queue Item.
   * @param result
   */
  addNewResult(result: QualityIndicators, color: string) {
    const resultKeys = Object.keys(result);
    for (const qualityIndicatorName of resultKeys) {
      if (qualityIndicatorName == "currentSeed") continue;
      if (!this.qualityIndicators[qualityIndicatorName].selected) continue;
      const newDataset = Object.assign(
        {
          borderColor: color,
          hidden: false,
          data: [null].concat(result[qualityIndicatorName]),
        },
        this.datasetOptions
      );
      this.chartDatasets.push(newDataset);
    }
  }

  /**
   * Constructs the new dataset based on the selected items.
   */
  updateChart() {
    if (!this.chart) {
      return;
    }

    this.chartDatasets = [];

    for (const queueItem of this.queueItems) {
      const qualityIndicatorSelected =
        Object.values(this.qualityIndicators).filter(
          (qualityIndicator) => qualityIndicator.selected
        ).length > 0;
      if (!(queueItem.selected && qualityIndicatorSelected)) continue;

      const legendDataset = {
        label: queueItem.name,
        borderColor: queueItem.color,
        backgroundColor: queueItem.color,
      };
      this.chartDatasets.push(legendDataset);
      this.updateLabels(queueItem.numberOfEvaluations / 100);
      queueItem.results.forEach((result) => {
        this.addNewResult(result, queueItem.color);
      });
    }
    this.chart.data.labels = this.chartLabels;
    this.chart.data.datasets = this.chartDatasets;
    this.chart.update();
  }

  selectQueueItem(queueItem: GraphQueueItem) {
    if (!this.initialized) return false;
    queueItem.selected = !queueItem.selected;
    if (
      Object.values(this.qualityIndicators).filter(
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
  [key: string]: {
    name: string;
    selected: boolean;
  };
};

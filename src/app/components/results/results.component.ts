import { Component, OnDestroy, OnInit } from "@angular/core";
import * as Chart from "chart.js";
import { Subscription } from "rxjs";
import { QueueItem } from "src/app/entities/queue-item";
import { User } from "src/app/entities/user";
import { UserManagementService } from "src/app/services/user-management.service";

@Component({
  selector: "app-results",
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.sass"]
})
export class ResultsComponent implements OnInit, OnDestroy {
  private chart: Chart;
  private chartDatasets: any[];

  private colors: Colors;
  private chartLabelsTmp: { [key: string]: boolean };
  private chartLabels: {}[];
  private userSubscription: Subscription;

  public qualityIndicators: {
    id: string;
    name: string;
    selected: boolean;
    labelPresent: boolean;
  }[];
  public queueItems: (QueueItem & { selected: boolean })[];

  constructor(private readonly sessionService: UserManagementService) {
    this.qualityIndicators = [
      {
        name: "Hypervolume",
        id: "hypervolume",
        selected: false,
        labelPresent: false
      },
      {
        name: "Generational Distance",
        id: "generationalDistance",
        selected: false,
        labelPresent: false
      },
      {
        name: "Inverted Generational Distance",
        id: "invertedGenerationalDistance",
        selected: false,
        labelPresent: false
      },
      { name: "Spacing", id: "spacing", selected: false, labelPresent: false },
      {
        name: "Additive Epsilon Indicator",
        id: "additiveEpsilonIndicator",
        selected: false,
        labelPresent: false
      },
      {
        name: "Contribution",
        id: "contribution",
        selected: false,
        labelPresent: false
      },
      {
        name: "R1 Indicator",
        id: "r1Indicator",
        selected: false,
        labelPresent: false
      },
      {
        name: "R2 Indicator",
        id: "r2Indicator",
        selected: false,
        labelPresent: false
      },
      {
        name: "R3 Indicator",
        id: "r3Indicator",
        selected: false,
        labelPresent: false
      },
      {
        name: "Elapsed Time",
        id: "elapsedTime",
        selected: false,
        labelPresent: false
      },
      {
        name: "Number of evaluations",
        id: "nfe",
        selected: false,
        labelPresent: false
      }
    ];
    this.chartDatasets = [];
    this.queueItems = [];
    this.colors = new Colors();
  }

  ngOnInit() {
    this.createChart();

    this.userSubscription = this.sessionService.user.subscribe(user => {
      this.chartDatasets = [];
      this.queueItems = [];
      if (user == null) {
        return;
      }
      this.updateChartDatasets(user);
    });
  }

  createChart() {
    this.chart = new Chart("chart", {
      type: "line",
      data: {
        datasets: this.chartDatasets
      },

      options: {
        elements: {
          line: {
            tension: 0 // disables bezier curves
          }
        },
        animation: {
          duration: 0
        },
        hover: {
          animationDuration: 0
        },
        responsiveAnimationDuration: 0,
        legend: {
          position: "bottom",
          labels: {
            filter: this.labelFilter
          }
        },
        responsive: true,
        scales: {
          ticks: {
            maxRotation: 0,
            sampleSize: 0
          },
          xAxes: [
            {
              type: "linear",

              scaleLabel: {
                display: true,
                labelString: "Number of evaluations",
                fontSize: 20,
                fontStyle: "bold"
              }
            }
          ],
          yAxes: [
            {
              type: "linear",
              scaleLabel: {
                display: true,
                labelString: "Value",
                fontSize: 20,
                fontStyle: "bold"
              }
            }
          ]
        }
      }
    });
  }

  labelFilter(label) {
    if (label.text != undefined) return true;
  }

  updateChartDatasets(user: User) {
    this.chartLabels = [];
    user.queue.forEach(queueItem => {
      let qI = Object.assign({ selected: false }, queueItem);
      this.queueItems.push(qI);

      this.chartDatasets.push({
        label: queueItem.name,

        // fill: false,
        borderColor: this.colors.color,
        // pointRadius: 0,
        // borderWidth: 0.5,
        hidden: true,
        queueItem: qI
      });
      this.qualityIndicators.forEach(qualityIndicator => {
        queueItem.results.forEach(result => {
          this.chartDatasets.push({
            data: result[qualityIndicator.id].map((result, index) => ({
              x: (index + 1) * 100,
              y: result
            })),
            fill: false,
            borderColor: this.colors.color,
            pointRadius: 0,
            borderWidth: 0.5,
            hidden: true,
            queueItem: qI,
            qualityIndicator
          });
        });
      });
      this.colors.next;
    });
    this.chart.data.datasets = this.chartDatasets;
    this.chart.update();
  }

  updateChart() {
    if (!this.chart) return false;

    this.chartDatasets.forEach(dataset => {
      if (dataset.label) {
        if (dataset.queueItem.selected) {
          if (this.qualityIndicators.find(value => value.selected)) {
            dataset.hidden = false;
          } else {
            dataset.hidden = true;
          }
        } else {
          dataset.hidden = true;
        }
      } else {
        dataset.hidden = !(
          dataset.qualityIndicator.selected && dataset.queueItem.selected
        );
      }
    });
    this.chart.update();
  }

  selectQueueItem(queueItem: QueueItem & { selected: boolean }) {
    queueItem.selected = !queueItem.selected;
    if (
      this.qualityIndicators.filter(
        qualityIndicator => qualityIndicator.selected
      ).length > 0
    )
      this.updateChart();
    return false;
  }

  selectQualityIndicator(qualityIndicator) {
    qualityIndicator.selected = !qualityIndicator.selected;
    if (this.queueItems.filter(queueItem => queueItem.selected).length > 0)
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
    "rgba(255, 255, 255, 1)"
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

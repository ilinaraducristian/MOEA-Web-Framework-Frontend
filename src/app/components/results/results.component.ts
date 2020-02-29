import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { Chart } from "chart.js";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { QueueItem } from "src/app/entities/queue-item";
import { UserManagementService } from "src/app/services/user-management.service";

@Component({
  selector: "app-results",
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.sass"]
})
export class ResultsComponent implements OnInit, OnDestroy {
  private chart: Chart;
  private chartDatasets: any[];
  private xAxisLimit = 500;

  public qualityIndicators: any[];
  public queueItem: QueueItem;
  private subscriptions: Subscription[];
  private userSubscription: Subscription;

  @ViewChild("graph", { static: false })
  set context(context: ElementRef) {
    this.showChart(context);
  }

  constructor(private readonly sessionService: UserManagementService) {
    this.qualityIndicators = [
      {
        name: "Hypervolume",
        id: "hypervolume",
        isActive: false,
        labelPresent: false
      },
      {
        name: "Generational Distance",
        id: "generationalDistance",
        isActive: false,
        labelPresent: false
      },
      {
        name: "Inverted Generational Distance",
        id: "invertedGenerationalDistance",
        isActive: false,
        labelPresent: false
      },
      { name: "Spacing", id: "spacing", isActive: false, labelPresent: false },
      {
        name: "Additive Epsilon Indicator",
        id: "additiveEpsilonIndicator",
        isActive: false,
        labelPresent: false
      },
      {
        name: "Contribution",
        id: "contribution",
        isActive: false,
        labelPresent: false
      },
      {
        name: "R1 Indicator",
        id: "r1Indicator",
        isActive: false,
        labelPresent: false
      },
      {
        name: "R2 Indicator",
        id: "r2Indicator",
        isActive: false,
        labelPresent: false
      },
      {
        name: "R3 Indicator",
        id: "r3Indicator",
        isActive: false,
        labelPresent: false
      },
      {
        name: "Elapsed Time",
        id: "elapsedTime",
        isActive: false,
        labelPresent: false
      },
      {
        name: "Number of evaluations",
        id: "nfe",
        isActive: false,
        labelPresent: false
      }
    ];
    this.chartDatasets = [];
    this.subscriptions = [];
  }

  ngOnInit() {
    this.userSubscription = this.sessionService.user
      .pipe(filter(user => user != null))
      .subscribe(user => {
        let rabbitId = localStorage.getItem("queueItemRabbitId");
        if (rabbitId == null) return;
        let queueItem = user.queue.find(
          queueItem => queueItem.rabbitId == rabbitId
        );
        if (queueItem == undefined) return;
        this.queueItem = queueItem;
        this.xAxisLimit = this.queueItem.numberOfEvaluations + 1000;
        this.chartDatasets = [];
        this.qualityIndicators.forEach(qualityIndicator => {
          this.queueItem.results.forEach(result => {
            this.chartDatasets.push({
              label: qualityIndicator.name,
              data: result[qualityIndicator.id].map((result, index) => ({
                x: (index + 1) * 100,
                y: result
              })),
              fill: false,
              borderColor: "rgba(255, 0, 0, .3)",
              pointRadius: 0,
              borderWidth: 1,
              hidden: !qualityIndicator.isActive,
              id: qualityIndicator.id
            });
          });
        });
        if (this.chart) {
          this.chart.data.datasets = this.chartDatasets;
          this.chart.update();
        }
      });
  }

  selectQualityIndicator(qualityIndicator) {
    if (!this.chart) return false;
    qualityIndicator.isActive = !qualityIndicator.isActive;
    this.chartDatasets
      .filter(dataset => dataset.id == qualityIndicator.id)
      .map(dataset => {
        dataset.hidden = !qualityIndicator.isActive;
        return dataset;
      });
    this.chart.update();
    return false;
  }

  showChart(context: ElementRef) {
    if (context == undefined) {
      this.chart = undefined;
      return;
    }
    this.chart = new Chart(context.nativeElement, {
      type: "line",
      data: {
        datasets: this.chartDatasets
      },
      options: {
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
            filter: (label, data) => {
              return false;
            }
          }
        },
        responsive: true,
        scales: {
          xAxes: [
            {
              type: "linear",
              ticks: {
                max: this.xAxisLimit
              },
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

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }
}

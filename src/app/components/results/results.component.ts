import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { empty, Subscription } from "rxjs";
import { User } from "src/app/entities/user";
import { SessionService } from "src/app/services/session.service";

@Component({
  selector: "app-results",
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.sass"]
})
export class ResultsComponent implements OnInit, OnDestroy {
  // Chart config

  private chartDatasets: any[];
  private xAxisLimit = 500;

  public qualityIndicators: any[];
  // public queueItem: QueueItem;
  public queue: {}[];
  private subscriptions: Subscription[];
  private userSubscription: Subscription;

  @ViewChild("graph", { static: true })
  public chart: Chart;

  constructor(private readonly sessionService: SessionService) {
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
    this.queue = [];
  }

  userIsNull() {
    this.chartDatasets = [];
    this.subscriptions = [];
    this.queue = [
      {
        isActive: false,
        queueItem: {
          name: "Problem noua",
          problem: "Belegundu",
          algorithm: "CMA-ES"
        }
      }
    ];

    return empty();
  }

  userIsNotNull(user: User) {
    return empty();
  }

  ngOnInit() {
    console.log(this.chart);
    this.userSubscription = this.sessionService.user.subscribe(user => {
      if (user == null) this.userIsNull();
      else {
        this.userIsNotNull(user);
      }
    });
    // .subscribe(user => {
    //   let rabbitId = localStorage.getItem("queueItemRabbitId");
    //   if (rabbitId == null) return;
    //   let queueItem = user.queue.find(
    //     queueItem => queueItem.rabbitId == rabbitId
    //   );
    //   if (queueItem == undefined) return;
    //   this.queueItem = queueItem;
    //   this.xAxisLimit = this.queueItem.numberOfEvaluations + 1000;
    //   this.chartDatasets = [];
    //   this.qualityIndicators.forEach(qualityIndicator => {
    //     this.queueItem.results.forEach(result => {
    //       this.chartDatasets.push({
    //         label: qualityIndicator.name,
    //         data: result[qualityIndicator.id].map((result, index) => ({
    //           x: (index + 1) * 100,
    //           y: result
    //         })),
    //         fill: false,
    //         borderColor: "rgba(255, 0, 0, .3)",
    //         pointRadius: 0,
    //         borderWidth: 1,
    //         hidden: !qualityIndicator.isActive,
    //         id: qualityIndicator.id
    //       });
    //     });
    //   });
    //   if (this.chart) {
    //     this.chart.data.datasets = this.chartDatasets;
    //     this.chart.update();
    //   }
    // });
  }

  selectQueueObject(queueObject) {
    queueObject.isActive = !queueObject.isActive;
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

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }
}

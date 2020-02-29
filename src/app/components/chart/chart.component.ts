import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { Chart, ChartDataSets } from "chart.js";

@Component({
  selector: "chart",
  templateUrl: "./chart.component.html",
  styleUrls: ["./chart.component.sass"]
})
export class ChartComponent implements OnInit {
  public chart;

  @Input("datasets")
  public chartDatasets: ChartDataSets[] = [];

  @ViewChild("graph", { static: true })
  set context(context: ElementRef) {
    this.createChart(context);
  }

  constructor() {}

  ngOnInit() {}

  createChart(context: ElementRef) {
    console.log("new chart");
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
                max: 500
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
}

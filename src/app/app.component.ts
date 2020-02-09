import { Component, OnDestroy } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { RxStompService } from "@stomp/ng2-stompjs";
import { Subscription } from "rxjs";
import { filter, flatMap, map, takeWhile } from "rxjs/operators";
import { SessionService } from "./services/session.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent implements OnDestroy {
  public activeRoute: String;
  private subscriptions: Subscription[];

  constructor(
    private readonly router: Router,
    private readonly sessionService: SessionService,
    private readonly rxStompService: RxStompService
  ) {
    this.activeRoute = "";
    this.subscriptions = [];
  }

  ngOnInit() {
    this.subscriptions.push(
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          map(navigation => {
            let url: string = navigation["url"];
            let lastSlash = url.indexOf("/", 1);
            if (lastSlash == -1) {
              url = url.slice(1);
            } else {
              url = url.slice(1, url.indexOf("/", 1));
            }
            return url;
          })
        )
        .subscribe(url => {
          this.activeRoute = url;
        })
    );
    this.subscriptions.push(
      this.sessionService.guestProblems.subscribe(guestProblems => {
        guestProblems
          .filter(guestProblem => guestProblem.solverId)
          .forEach(guestProblem => {
            this.subscriptions.push(
              this.rxStompService
                .watch(`guest.${guestProblem.rabbitId}`)
                .pipe(
                  takeWhile(
                    message => message["body"] != `{"status":"done"}`,
                    true
                  ),
                  flatMap(message => {
                    let messageBody = JSON.parse(message["body"]);
                    if (messageBody.error) {
                      guestProblem.status = "waiting";
                      guestProblem.solverId = undefined;
                      guestProblem.progress = undefined;
                      guestProblem.results = [];
                    } else if (messageBody.status) {
                      guestProblem.status = "done";
                      guestProblem.solverId = undefined;
                      guestProblem.progress = undefined;
                    } else {
                      guestProblem.results.push(messageBody);
                      guestProblem.progress = Math.floor(
                        (messageBody.currentSeed / guestProblem.numberOfSeeds) *
                          100
                      );
                    }
                    return this.sessionService.updateProblem(guestProblem);
                  })
                )
                .subscribe()
            );
          });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

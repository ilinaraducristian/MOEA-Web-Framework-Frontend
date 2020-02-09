import { Component } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { RxStompService } from "@stomp/ng2-stompjs";
import { filter, flatMap, map, takeWhile } from "rxjs/operators";
import { SessionService } from "./services/session.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent {
  public activeRoute: String;

  constructor(
    private readonly router: Router,
    private readonly sessionService: SessionService,
    private readonly rxStompService: RxStompService
  ) {
    this.activeRoute = "";
  }

  ngOnInit() {
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
      });
    this.sessionService.guestProblems.subscribe(guestProblems => {
      guestProblems
        .filter(guestProblem => guestProblem.solverId)
        .forEach(guestProblem => {
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
                  guestProblem.results = [];
                } else if (messageBody.status) {
                  guestProblem.status = "done";
                  guestProblem.solverId = undefined;
                } else {
                  guestProblem.results.push(messageBody);
                }
                return this.sessionService.updateProblem(guestProblem);
              })
            )
            .subscribe();
        });
    });
  }
}

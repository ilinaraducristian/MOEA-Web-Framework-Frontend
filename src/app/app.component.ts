import { Component, OnDestroy } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { filter, flatMap, map } from "rxjs/operators";
import { LoginComponent } from "./components/login/login.component";
import { User } from "./entities/user";
import { SessionService } from "./services/session.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent implements OnDestroy {
  public activeRoute: String;
  public loggedIn: boolean;
  private subscriptions: Subscription[];
  public user: User;

  constructor(
    private readonly router: Router,
    private readonly sessionService: SessionService
  ) {
    this.activeRoute = "";
    this.user = null;
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
      this.sessionService.user.subscribe(user => (this.user = user))
    );
    let jwt = localStorage.getItem("jwt");
    if (jwt != null) {
      this.loggedIn = true;
    }
  }

  signout() {
    this.sessionService
      .signOut()
      .pipe(
        flatMap(() => {
          this.loggedIn = false;
          return this.router.navigate(["/"]);
        })
      )
      .subscribe();
    return false;
  }

  onActivate(componentReference: Component) {
    if (componentReference instanceof LoginComponent) {
      componentReference.loggedIn.subscribe(() => {
        this.loggedIn = true;
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

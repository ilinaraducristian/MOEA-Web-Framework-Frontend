import { Component, OnDestroy } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { filter, map } from "rxjs/operators";
import { UserType } from "src/environments/environment";
import { User } from "./entities/user";
import { UserManagementService } from "./services/user-management.service";

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
    private readonly userManagementService: UserManagementService
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
      this.userManagementService.user.subscribe(user => {
        this.user = user;
        if (user == null) return;
        if (user.id == UserType.User) {
          this.loggedIn = true;
        } else {
          this.loggedIn = false;
        }
      })
    );
  }

  signout() {
    this.userManagementService.signOut().subscribe(() => {
      this.loggedIn = false;
      this.router.navigate(["/"]);
    });
    return false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

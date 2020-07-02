import { Component, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { UserType } from "src/environments/environment";
import { User } from "./entities/user";
import { UserManagementService } from "./services/user-management.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
})
export class AppComponent implements OnDestroy {
  private subscription: Subscription;

  public user: User;
  public UserType = UserType;

  constructor(
    private readonly router: Router,
    private readonly userManagementService: UserManagementService
  ) {
    this.user = null;
  }

  ngOnInit() {
    this.subscription = this.userManagementService.user.subscribe((user) => {
      this.user = user;
      if (user == null) return;
    });
  }

  logout() {
    this.userManagementService
      .logout()
      .then(() => {
        console.log("ok");
        this.router.navigateByUrl("");
      })
      .catch((error) => {
        console.log(error);
      });
    return false;
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }
}

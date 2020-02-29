import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { UserManagementService } from "src/app/services/user-management.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.sass"]
})
export class LoginComponent implements OnInit, OnDestroy {
  public formGroup: FormGroup;
  public badCredentials: boolean;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.formGroup = new FormGroup({
      username: new FormControl(""),
      password: new FormControl("")
    });
    this.badCredentials = false;
  }

  login() {
    this.userManagementService
      .login({
        username: this.formGroup.value.username,
        password: this.formGroup.value.password
      })
      .subscribe(
        () => this.router.navigate(["/"]),
        response => {
          if (response.error.message == "Bad credentials provided") {
            this.badCredentials = true;
          } else {
            // internal error
          }
        }
      );
    return false;
  }

  ngOnDestroy() {}
}

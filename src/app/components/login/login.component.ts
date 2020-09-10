import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { UserManagementService } from "src/app/services/user-management.service";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.sass"],
})
export class LoginComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  badCredentials: boolean;
  serviceAvailable: boolean;
  isMenuSelected: boolean;
  faEnvelope = faEnvelope;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly router: Router
  ) {
    this.isMenuSelected = true;
  }

  ngOnInit() {
    this.formGroup = new FormGroup({
      username: new FormControl(""),
      password: new FormControl(""),
    });
    this.badCredentials = false;
    this.serviceAvailable = true;
  }

  login() {
    this.userManagementService
      .login(this.formGroup.value.username, this.formGroup.value.password)
      .then(() => {
        console.log("ok");
        this.router.navigate(["/"]);
      })
      .catch((error) => {
        console.log(error);
      });
    return false;
  }

  ngOnDestroy() {}
}

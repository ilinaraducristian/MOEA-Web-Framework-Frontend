import { HttpClient } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-signup",
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.sass"]
})
export class SignupComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  serviceAvailable: boolean;

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient
  ) {
    this.serviceAvailable = true;
  }

  ngOnInit() {
    this.formGroup = new FormGroup({
      username: new FormControl(""),
      email: new FormControl(""),
      firstName: new FormControl(""),
      lastName: new FormControl(""),
      password: new FormControl(""),
      confirmPassword: new FormControl("")
    });
  }

  signup() {
    this.http
      .post(`${environment.user}/register`, {
        username: this.formGroup.value.username,
        password: this.formGroup.value.password,
        email: this.formGroup.value.email,
        firstName: this.formGroup.value.firstName,
        lastName: this.formGroup.value.lastName
      })
      .subscribe(
        () => this.router.navigate(["/login"]),
        error => {
          this.serviceAvailable = false;
        }
      );
    return false;
  }

  ngOnDestroy() {}
}

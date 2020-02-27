import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { SessionService } from "src/app/services/session.service";

@Component({
  selector: "app-signup",
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.sass"]
})
export class SignupComponent implements OnInit, OnDestroy {
  public formGroup: FormGroup;

  constructor(
    private readonly sessionService: SessionService,
    private readonly router: Router
  ) {}

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
    this.sessionService
      .signup({
        username: this.formGroup.value.username,
        password: this.formGroup.value.password,
        email: this.formGroup.value.email,
        firstName: this.formGroup.value.firstName,
        lastName: this.formGroup.value.lastName
      })
      .subscribe(() => this.router.navigate(["/login"]));
    return false;
  }

  ngOnDestroy() {}
}

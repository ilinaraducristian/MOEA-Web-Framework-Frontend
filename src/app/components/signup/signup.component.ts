import { HttpClient } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { UserManagementService } from "src/app/services/user-management.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-signup",
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.sass"]
})
export class SignupComponent implements OnInit, OnDestroy {
  public formGroup: FormGroup;
  public isBackendOnline: boolean;
  private subscription: Subscription;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly router: Router,
    private readonly http: HttpClient
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
    this.userManagementService.backendStatus.subscribe(
      isBackendOnline => (this.isBackendOnline = isBackendOnline)
    );
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
          // handle error
        }
      );
    return false;
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }
}

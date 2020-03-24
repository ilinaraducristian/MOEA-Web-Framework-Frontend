import { HttpClient } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { flatMap } from "rxjs/operators";
import { UserManagementService } from "src/app/services/user-management.service";
import { environment, UserType } from "src/environments/environment";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.sass"]
})
export class LoginComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  badCredentials: boolean;
  serviceAvailable: boolean;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly indexedDBService: NgxIndexedDBService
  ) {}

  ngOnInit() {
    this.formGroup = new FormGroup({
      username: new FormControl(""),
      password: new FormControl("")
    });
    this.badCredentials = false;
    this.serviceAvailable = true;
  }

  login() {
    this.http
      .post(`${environment.user}/login`, {
        username: this.formGroup.value.username,
        password: this.formGroup.value.password
      })
      .pipe(
        flatMap(response => {
          localStorage.setItem("jwt", response["jwt"]);
          return this.userManagementService.updateUser({
            id: UserType.User,
            username: response["username"],
            email: response["email"],
            firstName: response["firstName"],
            lastName: response["lastName"],
            problems: response["problems"],
            algorithms: response["algorithms"],
            queue: response["queue"]
          });
        })
      )
      .subscribe(
        () => {
          this.userManagementService.loggedIn = true;
          this.router.navigate(["/"]);
        },
        response => {
          if (response.error.message == "Bad credentials provided") {
            this.badCredentials = true;
          } else {
            this.serviceAvailable = false;
          }
        }
      );
    return false;
  }

  ngOnDestroy() {}
}

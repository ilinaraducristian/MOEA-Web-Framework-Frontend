import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { flatMap } from "rxjs/operators";
import { SessionService } from "src/app/services/session.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.sass"]
})
export class LoginComponent implements OnInit, OnDestroy {
  @Output() loggedIn = new EventEmitter<boolean>();

  public formGroup: FormGroup;
  public badCredentials: boolean;
  private subscription: Subscription;

  constructor(
    private readonly sessionService: SessionService,
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
    this.subscription = this.sessionService
      .login({
        username: this.formGroup.value.username,
        password: this.formGroup.value.password
      })
      .pipe(
        flatMap(() => {
          this.loggedIn.emit();
          return this.router.navigate(["/"]);
        })
      )
      .subscribe(null, response => {
        if (response.error.message == "Bad credentials provided") {
          this.badCredentials = true;
        }
      });
    return false;
  }

  ngOnDestroy() {
    if (this.subscription != null) this.subscription.unsubscribe();
  }
}

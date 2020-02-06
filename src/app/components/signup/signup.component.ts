import { Component, OnInit } from "@angular/core";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-signup",
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.sass"]
})
export class SignupComponent implements OnInit {
  constructor(private readonly userService: UserService) {}

  ngOnInit() {}

  signup() {
    this.userService
      .register({
        username: "user",
        password: "password",
        email: "user@email.com",
        firstName: "User"
      })
      .subscribe(a => console.log(a));
    return false;
  }
}

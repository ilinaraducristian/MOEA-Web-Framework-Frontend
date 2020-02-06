import { Component, OnInit } from "@angular/core";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.sass"]
})
export class LoginComponent implements OnInit {
  constructor(private readonly userService: UserService) {}

  ngOnInit() {}

  login() {
    this.userService
      .login({ username: "user", password: "password" })
      .subscribe(a => console.log(a));
    return false;
  }
}

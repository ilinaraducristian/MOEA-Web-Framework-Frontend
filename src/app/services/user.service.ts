import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { User } from "../dto/user";

@Injectable({
  providedIn: "root"
})
export class UserService {
  private loginHeaders: HttpHeaders;
  private jsonHeaders: HttpHeaders;

  constructor(private http: HttpClient) {
    this.loginHeaders = new HttpHeaders({
      Authorization: "Bearer "
    });
    this.jsonHeaders = new HttpHeaders({
      "Content-Type": "application/json"
    });
  }

  register(user: User) {
    return this.http.post(`${environment.backend}/user/register`, user, {
      headers: this.jsonHeaders
    });
  }

  login(user: User) {
    return this.http.post(`${environment.backend}/login`, user, {
      headers: this.loginHeaders
    });
  }
}

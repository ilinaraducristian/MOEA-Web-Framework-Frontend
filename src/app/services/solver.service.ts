import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { ProblemDTO } from "../dto/problemDTO";

@Injectable({
  providedIn: "root"
})
export class SolverService {
  private loginHeaders: HttpHeaders;
  private jsonHeaders: HttpHeaders;

  constructor(private http: HttpClient) {
    this.loginHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: "Bearer "
    });
    this.jsonHeaders = new HttpHeaders({
      "Content-Type": "application/json"
    });
  }

  addToQueue(problem: ProblemDTO) {
    return this.http.post(`${environment.guestQueue}/addProblem`, problem, {
      headers: this.jsonHeaders
    });
  }

  solveProblem(id: number) {
    return this.http.get(`${environment.guestQueue}/solveProblem/${id}`);
  }
}

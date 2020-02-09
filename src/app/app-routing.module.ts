import { NgModule } from "@angular/core";
import { Route, RouterModule } from "@angular/router";
import { HomeComponent } from "./components/home/home.component";
import { LoginComponent } from "./components/login/login.component";
import { ProblemComponent } from "./components/problem/problem.component";
import { QueueComponent } from "./components/queue/queue.component";
import { ResultsComponent } from "./components/results/results.component";
import { SignupComponent } from "./components/signup/signup.component";

export const routes: CustomRoute[] = [
  { path: "", component: HomeComponent, navbarName: "Home" },
  { path: "problem", component: ProblemComponent, navbarName: "Problem" },
  { path: "login", component: LoginComponent, navbarName: "Log In" },
  { path: "signup", component: SignupComponent, navbarName: "Sign Up" },
  { path: "queue", component: QueueComponent, navbarName: "Queue" },
  { path: "results", component: ResultsComponent, navbarName: "Results" }
];

interface CustomRoute extends Route {
  navbarName?: String;
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

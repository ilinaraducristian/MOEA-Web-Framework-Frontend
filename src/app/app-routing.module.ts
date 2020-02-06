// Modules
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from "./components/login/login.component";
import { SignupComponent } from "./components/signup/signup.component";
// Components
import { ProblemComponent } from "./problems/problem/problem.component";
import { ProblemsModule } from "./problems/problems.module";
import { TestComponent } from "./test/test/test.component";

const routes: Routes = [
  { path: "problems", component: ProblemComponent },
  { path: "login", component: LoginComponent },
  { path: "signup", component: SignupComponent },
  { path: "test", component: TestComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), ProblemsModule],
  exports: [RouterModule]
})
export class AppRoutingModule {}

import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {ProblemComponent} from './components/problem/problem.component';

export const routes: CustomRoutes = [
  {path: '', component: HomeComponent, title: 'Home'},
  {path: 'problem', component: ProblemComponent, title: 'Problem'}
  // { path: 'login', component: LoginComponent, fragment: 'Log In' },
  // { path: 'signup', component: SignupComponent, fragment: 'Sign Up' },
  // { path: 'queue', component: QueueComponent, fragment: 'Queue' },
  // { path: 'results', component: ResultsComponent, fragment: 'Results' }
];

export declare type CustomRoutes = CustomRoute[];

interface CustomRoute extends Route {
  title?: string;
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { QueueItemComponent } from './components/queue-item/queue-item.component';
import { QueueComponent } from './components/queue/queue.component';
import { ResultsComponent } from './components/results/results.component';

export const routes: CustomRoutes = [
  { path: '', component: HomeComponent, title: 'Home' },
  { path: 'test', component: QueueItemComponent, title: 'Test' },
  { path: 'queue', component: QueueComponent, title: 'Queue' },
  { path: 'results', component: ResultsComponent, title: 'Results' },
];

export declare type CustomRoutes = CustomRoute[];

interface CustomRoute extends Route {
  title?: string;
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

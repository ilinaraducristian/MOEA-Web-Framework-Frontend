import {HttpClient} from '@angular/common/http';
import {Component, OnInit} from '@angular/core';
import {KeycloakService} from 'keycloak-angular';
import {filter, map, takeUntil} from 'rxjs/operators';
import {routes} from './app-routing.module';
import {RxBaseComponent} from './rx-base-component';
import {OnlineStatusService} from './services/online-status.service';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {NavigationEvent} from '@ng-bootstrap/ng-bootstrap/datepicker/datepicker-view-model';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent extends RxBaseComponent implements OnInit {
  public routes = routes;
  public isOffline = false;

  constructor(
    // private readonly keycloak: KeycloakService,
    private readonly http: HttpClient,
    private readonly onlineStatus: OnlineStatusService,
    public readonly router: Router
  ) {
    super();
    // check if user is logged in
    // if he's logged in display in navbar username and dropdown
    // if he's not logged in display signup and login
    // check if browser is online
    // if !online display a message
    // keycloak.isLoggedIn().then((value) => {
    //   console.log(value);
    //   if (!value) {
    //     return this.keycloak.login().then(() => {});
    //   }
    //   return this.http
    //     .get('http://localhost:8080/asd')
    //     .toPromise()
    //     .then((a) => {
    //       console.log(a);
    //     });
    // });
  }

  ngOnInit(): void {
    this.onlineStatus.isOnline
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((isOnline) => {
        this.isOffline = !isOnline;
      });
  }

}

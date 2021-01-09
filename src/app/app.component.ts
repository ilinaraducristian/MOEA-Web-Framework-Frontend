import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { takeUntil } from 'rxjs/operators';
import { routes } from './app-routing.module';
import { RxBaseComponent } from './rx-base-component';
import { OnlineStatusService } from './services/online-status.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent extends RxBaseComponent implements OnInit {
  public routes = routes;
  public isOffline = false;

  constructor(
    private readonly keycloak: KeycloakService,
    private readonly http: HttpClient,
    private readonly onlineStatus: OnlineStatusService
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

  // constructor(public route: ActivatedRoute,
  //             private readonly http: HttpClient,
  //             private readonly keycloak: KeycloakService) {
  //   console.log(keycloak.isLoggedIn());
  // }
}

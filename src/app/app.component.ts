import {Component} from '@angular/core';
import {routes} from './app-routing.module';
import {HttpClient} from '@angular/common/http';
import {KeycloakService} from 'keycloak-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  routes = routes;
  links = [
    {title: 'One', fragment: 'one'},
    {title: 'Two', fragment: 'two'}
  ];

  constructor(private readonly keycloak: KeycloakService, private readonly http: HttpClient) {
    keycloak.isLoggedIn().then(value => {
      console.log(value);

      if (!value) {
        return this.keycloak.login().then(() => {
        });
      }
      return this.http.get('http://localhost:8080/asd').toPromise().then(a => {
        console.log(a);
      });
    });
  }

  // constructor(public route: ActivatedRoute,
  //             private readonly http: HttpClient,
  //             private readonly keycloak: KeycloakService) {
  //   console.log(keycloak.isLoggedIn());
  // }
}

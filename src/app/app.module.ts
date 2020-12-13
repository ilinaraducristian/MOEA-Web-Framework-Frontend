import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {HomeComponent} from './components/home/home.component';
import {ProblemComponent} from './components/problem/problem.component';
import {DBConfig, NgxIndexedDBModule} from 'ngx-indexed-db';
import {KeycloakAngularModule, KeycloakService} from 'keycloak-angular';
import {environment} from '../environments/environment';
import {HttpClientModule} from '@angular/common/http';

const dbConfig: DBConfig = {
  name: 'moeawebframework',
  version: 1,
  objectStoresMeta: [{
    store: 'people',
    storeConfig: {keyPath: 'id', autoIncrement: true},
    storeSchema: [
      {name: 'name', keypath: 'name', options: {unique: false}},
      {name: 'email', keypath: 'email', options: {unique: false}}
    ]
  }]
};

export const indexedDBConfig: DBConfig = {
  name: 'moeawebframework',
  version: 1,
  objectStoresMeta: [
    {
      store: 'users',
      storeConfig: {keyPath: 'id', autoIncrement: false},
      storeSchema: [
        {
          name: 'username',
          keypath: 'username',
          options: {unique: true}
        },
        {
          name: 'email',
          keypath: 'email',
          options: {unique: true}
        },
        {
          name: 'firstName',
          keypath: 'firstName',
          options: {unique: true}
        },
        {
          name: 'lastName',
          keypath: 'lastName',
          options: {unique: false}
        },
        {
          name: 'problems',
          keypath: 'problems',
          options: {unique: false}
        },
        {
          name: 'algorithms',
          keypath: 'algorithms',
          options: {unique: false}
        },
        {
          name: 'queue',
          keypath: 'queue',
          options: {unique: false}
        }
      ]
    }
  ]
};

function initializeKeycloak(keycloak: KeycloakService): () => Promise<boolean> {
  return () =>
    keycloak.init({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId,
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
      }
    });
}
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProblemComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    NgxIndexedDBModule.forRoot(dbConfig),
    HttpClientModule,
    KeycloakAngularModule
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService]
  }],
  bootstrap: [AppComponent]
})
export class AppModule {
}

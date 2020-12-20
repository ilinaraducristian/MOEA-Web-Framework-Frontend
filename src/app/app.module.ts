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
import {InjectableRxStompConfig, RxStompService, rxStompServiceFactory} from '@stomp/ng2-stompjs';

export const rxStompConfig: InjectableRxStompConfig = {
  // Which server?
  brokerURL: 'ws://127.0.0.1:15674/ws',

  // Headers
  // Typical keys: login, passcode, host
  connectHeaders: {
    login: 'guest',
    passcode: 'guest',
  },
  // How often to heartbeat?
  // Interval in milliseconds, set to 0 to disable
  heartbeatIncoming: 0, // Typical value 0 - disabled
  heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds

  // Wait in milliseconds before attempting auto reconnect
  // Set to 0 to disable
  // Typical value 500 (500 milli seconds)
  reconnectDelay: 1000,

  // Will log diagnostics on console
  // It can be quite verbose, not recommended in production
  // Skip this key to stop logging to console
  // debug: (msg: string): void => {
  //   console.log(new Date(), msg);
  // },
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
    NgxIndexedDBModule.forRoot(indexedDBConfig),
    HttpClientModule,
    KeycloakAngularModule
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService]
  },
    {
      provide: InjectableRxStompConfig,
      useValue: rxStompConfig,
    },
    {
      provide: RxStompService,
      useFactory: rxStompServiceFactory,
      deps: [InjectableRxStompConfig],
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

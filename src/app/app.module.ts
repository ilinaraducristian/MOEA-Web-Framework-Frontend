import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { ServiceWorkerModule } from "@angular/service-worker";
import { JwtModule } from "@auth0/angular-jwt";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import {
  InjectableRxStompConfig,
  RxStompService,
  rxStompServiceFactory,
} from "@stomp/ng2-stompjs";
import { NgxIndexedDBModule } from "ngx-indexed-db";
import { rxStompConfig } from "src/configurations/rxStompConfig";
import { indexedDBConfig } from "../configurations/indexedDBConfig";
import { environment } from "../environments/environment";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AuthorizationHttpInterceptor } from "./authorization-http-interceptor";
import { HomeComponent } from "./components/home/home.component";
import { LoginComponent } from "./components/login/login.component";
import { ProblemComponent } from "./components/problem/problem.component";
import { QueueComponent } from "./components/queue/queue.component";
import { ResultsComponent } from "./components/results/results.component";
import { SignupComponent } from "./components/signup/signup.component";

import {
  SocialLoginModule,
  SocialAuthServiceConfig,
} from "angularx-social-login";
import {
  GoogleLoginProvider,
  FacebookLoginProvider,
  AmazonLoginProvider,
} from "angularx-social-login";

export function tokenGetter() {
  return localStorage.getItem("jwt");
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    HomeComponent,
    QueueComponent,
    ProblemComponent,
    ResultsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    NgxIndexedDBModule.forRoot(indexedDBConfig),
    HttpClientModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SocialLoginModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter,
        whitelistedDomains: [environment.backendDomain],
      },
    }),
  ],
  providers: [
    {
      provide: InjectableRxStompConfig,
      useValue: rxStompConfig,
    },
    {
      provide: RxStompService,
      useFactory: rxStompServiceFactory,
      deps: [InjectableRxStompConfig],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthorizationHttpInterceptor,
      multi: true,
    },
    {
      provide: "SocialAuthServiceConfig",
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider("clientId"),
          },
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider("clientId"),
          },
          {
            id: AmazonLoginProvider.PROVIDER_ID,
            provider: new AmazonLoginProvider("clientId"),
          },
        ],
      } as SocialAuthServiceConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

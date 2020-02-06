// Modules
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgxIndexedDBModule } from "ngx-indexed-db";
import { AppRoutingModule } from "./app-routing.module";
// Components
import { AppComponent } from "./app.component";
import { LoginComponent } from "./components/login/login.component";
import { SignupComponent } from "./components/signup/signup.component";
// Configurations
import { indexedDBConfig } from "./indexedDBConfig";
// Services
import { UserService } from "./services/user.service";
import { TestModule } from "./test/test.module";

@NgModule({
  declarations: [AppComponent, LoginComponent, SignupComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    NgxIndexedDBModule.forRoot(indexedDBConfig),
    HttpClientModule,
    TestModule
  ],
  providers: [UserService],
  bootstrap: [AppComponent]
})
export class AppModule {}

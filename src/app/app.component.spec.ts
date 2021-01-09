import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { QueueItemComponent } from './components/queue-item/queue-item.component';
import { QueueComponent } from './components/queue/queue.component';
import { ResultsComponent } from './components/results/results.component';
import { NgxIndexedDBTestingModule } from './testing-modules/indexed-db-testing/ngx-Indexed-db-testing.module';
import { KeycloakTestingModule } from './testing-modules/keycloak/keycloak-testing.module';
import {routes} from './app-routing.module';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgxIndexedDBTestingModule,
        KeycloakTestingModule,
        BrowserModule,
        RouterTestingModule.withRoutes(routes),
        NgbModule,
        FormsModule,
      ],
      declarations: [
        AppComponent,
        HomeComponent,
        QueueItemComponent,
        QueueComponent,
        ResultsComponent,
      ],
    }).compileComponents();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    expect(app).toBeTruthy();
  });
});

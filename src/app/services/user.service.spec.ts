import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { APP_INITIALIZER } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  InjectableRxStompConfig,
  RxStompService,
  rxStompServiceFactory,
} from '@stomp/ng2-stompjs';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { indexedDBConfig, rxStompConfig } from '../app.module';
import { QueueItem } from '../entities/queue-item';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let rxStompService: RxStompService;
  let httpTestingController: HttpTestingController;

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgxIndexedDBModule.forRoot(indexedDBConfig),
        KeycloakAngularModule,
      ],
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: () => () => Promise.resolve(),
          multi: true,
          deps: [KeycloakService],
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
    });
    service = TestBed.inject(UserService);
    rxStompService = TestBed.inject(RxStompService);
    rxStompService.deactivate();
    httpTestingController = TestBed.inject<HttpTestingController>(
      HttpTestingController
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('testing a request', () => {
    service
      .testFcn()
      .then((v) => {
        console.log('value');
        console.log(v);
      })
      .catch((e) => {
        console.log('error');
        console.log(e);
      });
  });

  it('should return the rabbit id', () => {
    const queueItem = new QueueItem();
    //   service.addQueueItem(UserType.Guest, queueItem).subscribe((a) => {
    //     expect(a).toMatch('8abdbf4a-714d-49a7-9ad0-26a8b156eae2');
    //   });
    //   httpTestingController.expectOne(`${environment.backend}/queue`).flush('8abdbf4a-714d-49a7-9ad0-26a8b156eae2');
  });
});

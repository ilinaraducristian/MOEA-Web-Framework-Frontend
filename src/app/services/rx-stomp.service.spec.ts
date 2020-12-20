import {TestBed} from '@angular/core/testing';

import {InjectableRxStompConfig, RxStompService, rxStompServiceFactory} from '@stomp/ng2-stompjs';
import {rxStompConfig} from '../app.module';

describe('RxStompService', () => {
  let service: RxStompService;

  beforeAll(() => {
    TestBed.configureTestingModule({
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
      ]
    });
    service = TestBed.inject(RxStompService);
  });

  afterAll(() => {
    service.deactivate();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send and receive message from broker', () => {
    service.publish({destination: 'destination', body: 'message'});
    return new Promise(resolve => {
      const subscription = service.watch('destination').subscribe(message => {
        expect(message.body).toBe('message');
        subscription.unsubscribe();
        resolve();
      });
    });
  });

});

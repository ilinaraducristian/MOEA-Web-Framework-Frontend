import { TestBed } from '@angular/core/testing';
import { RxStompService } from '@stomp/ng2-stompjs';
import { RxStompTestingModule } from './rx-stomp-testing.module';

describe('RxStompTestingModule', () => {
  let service: RxStompService;

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [RxStompTestingModule],
    });
    service = TestBed.inject(RxStompService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

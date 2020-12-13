import {TestBed} from '@angular/core/testing';

import {UserService, UserType} from './user.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {environment} from '../../environments/environment';
import {QueueItem} from '../entities/queue-item';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject<HttpTestingController>(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the rabbit id', () => {
    const queueItem = new QueueItem();
    service.addQueueItem(UserType.Guest, queueItem).subscribe((a) => {
      expect(a).toMatch('8abdbf4a-714d-49a7-9ad0-26a8b156eae2');
    });
    httpTestingController.expectOne(`${environment.backend}/queue`).flush('8abdbf4a-714d-49a7-9ad0-26a8b156eae2');
  });

});

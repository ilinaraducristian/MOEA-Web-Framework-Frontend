import { HttpRequest } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { filter, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { v4 as uuid } from 'uuid';
import { QueueItem } from '../entities/queue-item';
import { QueueItemDTO } from '../entities/queue-item-dto';
import { User } from '../entities/user';
import { NgxIndexedDBTestingModule } from '../testing-modules/indexed-db-testing/ngx-Indexed-db-testing.module';
import { RxStompTestingModule } from '../testing-modules/rx-stomp-testing/rx-stomp-testing.module';
import { UserType } from '../user-type.enum';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let httpTestingController: HttpTestingController;
  let service: UserManagementService;
  let indexedDBService: NgxIndexedDBService;

  const backendDB: Map<string, any> = new Map();

  describe('first visit', () => {
    beforeAll(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          NgxIndexedDBTestingModule,
          RxStompTestingModule,
        ],
      });
      httpTestingController = TestBed.inject(HttpTestingController);
      service = TestBed.inject(UserManagementService);
      indexedDBService = TestBed.inject(NgxIndexedDBService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should validate the new guest', async () => {
      await service.isReady
        .pipe(
          filter((isReady) => isReady === true),
          take(1)
        )
        .toPromise();
      const guest = service.user.getValue();
      expect(guest).toBe(NgxIndexedDBTestingModule.mockDatabase.users[0]);
    });

    it('should add a new queue item', async () => {
      const queueItem = new QueueItem();
      queueItem.name = 'New queue item';
      queueItem.numberOfEvaluations = 10000;
      queueItem.numberOfSeeds = 10;
      queueItem.algorithmMD5 = 'NSGAIII';
      queueItem.problemMD5 = 'Belegundu';
      queueItem.referenceSetMD5 = 'Belegundu';

      service
        .addQueueItem(queueItem)
        .then(() => service.user.pipe(take(1)).toPromise())
        .then((user: User) => {
          expect(user.queue.size).toBe(1);
        });
      const req = httpTestingController.expectOne(
        environment.backend + environment.urls[UserType.Guest].queue
      );
      const reqBody = req.request.body;
      expect(reqBody instanceof QueueItemDTO).toBeTruthy();

      reqBody.rabbitId = uuid();
      backendDB.set(reqBody.rabbitId, reqBody);
      req.flush(reqBody.rabbitId);

      await asyncWait(10);

      const savedGuest = NgxIndexedDBTestingModule.mockDatabase.users[
        UserType.Guest
      ].queue.get(reqBody.rabbitId) as QueueItem;
      expect(savedGuest.rabbitId).toBe(reqBody.rabbitId);
    });
  });

  describe('second visit', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          NgxIndexedDBTestingModule,
          RxStompTestingModule,
        ],
      });
      httpTestingController = TestBed.inject(HttpTestingController);
      indexedDBService = TestBed.inject(NgxIndexedDBService);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('should store the updated queue', async () => {
      service = TestBed.inject(UserManagementService);
      await asyncWait(10);
      let rabbitIds: any[] = [];
      const req = httpTestingController.expectOne(
        (req: HttpRequest<string[]>) => {
          const match = req.url.includes(
            environment.backend + environment.urls[UserType.Guest].queue
          );
          if (!match) return false;
          const ids = req.url.substr(req.url.lastIndexOf('/') + 1);
          rabbitIds = ids.split(',');
          return true;
        }
      );

      expect(rabbitIds.length).toBeGreaterThan(0);
      req.flush(rabbitIds.map((rabbitId) => backendDB.get(rabbitId)));
    });
  });
});

async function asyncWait(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

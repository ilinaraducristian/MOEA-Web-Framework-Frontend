import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { QueueItem } from 'src/app/entities/queue-item';
import { User } from 'src/app/entities/user';
import { UserManagementService } from 'src/app/services/user-management.service';
import { QueueComponent } from './queue.component';

describe('QueueComponent', () => {
  let component: QueueComponent;
  let fixture: ComponentFixture<QueueComponent>;
  let userManagementServiceSpy: any;

  beforeAll(async () => {
    userManagementServiceSpy = jasmine.createSpyObj('', [
      'processQueueItem',
      'cancelQueueItem',
      'removeQueueItem',
    ]);

    const user = new User();
    const queueItem = new QueueItem();

    queueItem.rabbitId = 'ff1d6f34-5c5f-4c00-a630-005bc1266ca7';
    queueItem.algorithmMD5 = 'Algorithm 1';
    queueItem.problemMD5 = 'Problem 1';
    queueItem.name = 'A new testing';
    queueItem.numberOfEvaluations = 10000;
    queueItem.numberOfSeeds = 10;
    queueItem.referenceSetMD5 = queueItem.problemMD5;
    queueItem.status = 'waiting';
    queueItem.progress = -1;
    user.algorithms = ['Algorithm1', 'Algorithm2', 'Algorithm3'];
    user.problems = ['Problem1', 'Problem2', 'Problem3'];

    user.queue.set(queueItem.rabbitId, queueItem);

    const isReadyObs = new BehaviorSubject<boolean>(true).asObservable();
    const isOnlineObs = new BehaviorSubject<boolean>(true).asObservable();
    const userSubject = new BehaviorSubject<User>(user);
    const userObs = userSubject.asObservable();

    Object.defineProperty(userManagementServiceSpy, 'isReady', {
      value: isReadyObs,
    });
    Object.defineProperty(userManagementServiceSpy, 'isOnline', {
      value: isOnlineObs,
    });
    Object.defineProperty(userManagementServiceSpy, 'user', {
      value: userObs,
    });

    userManagementServiceSpy.processQueueItem.and.callFake(
      async (queueItem: QueueItem) => {
        queueItem.status = 'processing';
        queueItem.progress = 0;
        await userSubject.next(user);
      }
    );

    userManagementServiceSpy.cancelQueueItem.and.callFake(
      async (queueItem: QueueItem) => {
        queueItem.status = 'waiting';
        queueItem.progress = -1;
        await userSubject.next(user);
      }
    );

    userManagementServiceSpy.removeQueueItem.and.callFake(
      async (queueItem: QueueItem) => {
        user.queue.delete(queueItem.rabbitId);
        await userSubject.next(user);
      }
    );
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QueueComponent],
      providers: [
        { provide: UserManagementService, useValue: userManagementServiceSpy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QueueComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture).toBeTruthy();
  });

  it('should update the queue item after processing', async () => {
    fixture.detectChanges();
    await userManagementServiceSpy.processQueueItem(
      component.user.queue.values().next().value
    );
    fixture.detectChanges();
    expect(component.user.queue.values().next().value.progress).toBe(0);
  });

  it('should update the queue item after canceling', async () => {
    fixture.detectChanges();
    await userManagementServiceSpy.cancelQueueItem(
      component.user.queue.values().next().value
    );
    fixture.detectChanges();
    expect(component.user.queue.values().next().value.progress).toBe(-1);
  });

  it('should update the queue item after removing', async () => {
    fixture.detectChanges();
    await userManagementServiceSpy.removeQueueItem(
      component.user.queue.values().next().value
    );
    fixture.detectChanges();
    expect(component.user.queue.values().next().value).toBeUndefined();
  });
});

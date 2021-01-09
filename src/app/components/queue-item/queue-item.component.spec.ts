import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/app/entities/user';
import { UserManagementService } from 'src/app/services/user-management.service';
import { QueueItemComponent } from './queue-item.component';

describe('QueueItemComponent', () => {
  let component: QueueItemComponent;
  let fixture: ComponentFixture<QueueItemComponent>;
  let userManagementServiceSpy: any;

  beforeAll(async () => {
    userManagementServiceSpy = jasmine.createSpyObj('UserManagementService', [
      'addQueueItem',
    ]);

    const user = new User();
    user.algorithms = ['Algorithm1', 'Algorithm2', 'Algorithm3'];
    user.problems = ['Problem1', 'Problem2', 'Problem3'];

    const isReadyObs = new BehaviorSubject<boolean>(true).asObservable();
    const userObs = new BehaviorSubject<User>(user).asObservable();

    Object.defineProperty(userManagementServiceSpy, 'isReady', {
      value: isReadyObs,
    });
    Object.defineProperty(userManagementServiceSpy, 'user', {
      value: userObs,
    });
  });

  beforeEach(async () => {
    userManagementServiceSpy.addQueueItem.and.callFake(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 500);
        })
    );
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [QueueItemComponent],
      providers: [
        { provide: UserManagementService, useValue: userManagementServiceSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(QueueItemComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new queue item and redirect', async () => {
    await component.addQueueItem();

    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1).toBeNull();
  });

  it('should stop loading and display error', async () => {
    userManagementServiceSpy.addQueueItem.and.callFake(
      () =>
        new Promise((_, reject) => {
          setTimeout(reject, 1000);
        })
    );

    await component.addQueueItem();
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toBe(component.error as string);
  });
});

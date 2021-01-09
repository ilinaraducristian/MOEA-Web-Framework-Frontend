import {Component, OnInit} from '@angular/core';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {QueueItem} from 'src/app/entities/queue-item';
import {User} from 'src/app/entities/user';
import {RxBaseComponent} from 'src/app/rx-base-component';
import {UserManagementService} from 'src/app/services/user-management.service';
import {Router} from '@angular/router';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-queue-item',
  templateUrl: './queue-item.component.html',
  styleUrls: ['./queue-item.component.css'],
})
export class QueueItemComponent extends RxBaseComponent implements OnInit {
  public isReady = false;
  public user: User = new User();

  public queueItem: QueueItem = new QueueItem();

  public isCreatingQueueItem = false;
  public error: string | undefined;

  constructor(private readonly userManagementService: UserManagementService,
              private readonly router: Router) {
    super();
  }

  ngOnInit(): void {
    this.userManagementService.isReady
      .pipe(
        filter((isReady) => isReady === true),
        take(1),
        switchMap(() => {
          this.isReady = true;
          return this.userManagementService.user;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((user) => {
        this.user = user;
      });
    // check if online
    // if online add item to user queue
    // if !online add item to user pending queue
    // P.S. the pending queue will add item to the first queue if online is detected
  }

  async addQueueItem(): Promise<void> {
    this.isCreatingQueueItem = true;
    try {
      await this.userManagementService.addQueueItem(this.queueItem);
      await this.router.navigateByUrl('queue');
    } catch (e) {
      this.error = 'An error occured';
    }
    this.isCreatingQueueItem = false;
  }
}

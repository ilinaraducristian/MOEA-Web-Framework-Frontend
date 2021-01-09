import {Component, OnInit} from '@angular/core';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {QueueItem} from 'src/app/entities/queue-item';
import {User} from 'src/app/entities/user';
import {RxBaseComponent} from 'src/app/rx-base-component';
import {OnlineStatusService} from 'src/app/services/online-status.service';
import {UserManagementService} from 'src/app/services/user-management.service';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.css'],
})
export class QueueComponent extends RxBaseComponent implements OnInit {
  public Array = Array;

  public isReady = false;
  public isOnline = false;
  public user: User = new User();

  private isActionPerforming = false;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly onlineStatusService: OnlineStatusService
  ) {
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
    this.onlineStatusService.isOnline
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((isOnline) => (this.isOnline = isOnline));
  }

  async startProcessing(rabbitId: string): Promise<void> {
    if (this.isActionPerforming === true) {
      return;
    }
    this.isActionPerforming = true;
    try {
      const queueItem = this.user.queue.get(rabbitId);
      if (queueItem === undefined) {
        throw new Error('QueueItem is undefined');
      }
      await this.userManagementService.processQueueItem(queueItem);
    } catch (error) {
      console.log(error);
    }
    this.isActionPerforming = false;
  }

  async cancelProcessing(queueItem: QueueItem): Promise<void> {
    if (this.isActionPerforming === true) {
      return;
    }
    this.isActionPerforming = true;
    try {
      await this.userManagementService.cancelProcessing(queueItem);
    } catch (error) {
      console.log(error);
    }
    this.isActionPerforming = false;
  }

  async removeQueueItem(queueItem: QueueItem): Promise<void> {
    if (this.isActionPerforming === true) {
      return;
    }
    this.isActionPerforming = true;
    try {
      await this.userManagementService.removeQueueItem(queueItem);
    } catch (error) {
      console.log(error);
    }
    this.isActionPerforming = false;
  }
}

import {Component, OnInit} from '@angular/core';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {QueueItem} from 'src/app/entities/queue-item';
import {User} from 'src/app/entities/user';
import {RxBaseComponent} from 'src/app/rx-base-component';
import {UserManagementService} from 'src/app/services/user-management.service';
import {Router} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, NgForm, Validators} from '@angular/forms';

@Component({
  selector: 'app-queue-item',
  templateUrl: './queue-item.component.html',
  styleUrls: ['./queue-item.component.css'],
})
export class QueueItemComponent extends RxBaseComponent implements OnInit {
  public isReady = false;
  public user: User = new User();

  public form: FormGroup;
  public isCreatingQueueItem = false;
  public error: string | undefined;

  constructor(private readonly userManagementService: UserManagementService,
              private readonly router: Router,
              private readonly formBuilder: FormBuilder
  ) {
    super();
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(/^[ a-zA-Z0-9_]*$/)]],
      numberOfEvaluations: [10000, [Validators.required, Validators.min(500)]],
      numberOfSeeds: [10, [Validators.required, Validators.min(1)]],
      algorithm: ['', Validators.required],
      problem: ['', Validators.required],
    });
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
        this.form.patchValue({
          algorithm: user.algorithms[0],
          problem: user.problems[0]
        });
      });
    // check if online
    // if online add item to user queue
    // if !online add item to user pending queue
    // P.S. the pending queue will add item to the first queue if online is detected
  }

  async addQueueItem(form: FormGroup): Promise<boolean> {
    this.isCreatingQueueItem = true;
    const queueItem = new QueueItem(form);
    try {
      await this.userManagementService.addQueueItem(queueItem);
      await this.router.navigateByUrl('queue');
    } catch (e) {
      console.log(e);
      this.error = 'An error occured';
    }
    this.isCreatingQueueItem = false;
    return false;
  }
}

import { Component, OnInit } from '@angular/core';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { User } from 'src/app/entities/user';
import { RxBaseComponent } from 'src/app/rx-base-component';
import { UserManagementService } from 'src/app/services/user-management.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css'],
})
export class ResultsComponent extends RxBaseComponent implements OnInit {
  public user: User | undefined;

  constructor(private readonly userManagementService: UserManagementService) {
    super();
  }

  ngOnInit(): void {
    this.userManagementService.isReady
      .pipe(
        filter((isReady) => isReady === true),
        take(1),
        switchMap(() => this.userManagementService.user),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((user) => {
        this.user = user;
      });
  }
}

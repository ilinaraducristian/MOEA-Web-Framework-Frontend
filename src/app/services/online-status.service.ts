import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OnlineStatusService {
  private readonly isOnline$: BehaviorSubject<boolean>;

  constructor() {
    this.isOnline$ = new BehaviorSubject<boolean>(true);
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
    });
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }

  get isOnline(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }
}

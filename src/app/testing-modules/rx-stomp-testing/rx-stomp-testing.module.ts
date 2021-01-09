import { CommonModule } from '@angular/common';
import { NgModule, Provider } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { Observable, of } from 'rxjs';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [RxStompTestingModule.forRoot()],
})
export class RxStompTestingModule {
  static forRoot(): Provider {
    const rxStompServiceSpy = jasmine.createSpyObj('RxStompService', ['watch']);
    rxStompServiceSpy.watch.and.callFake(RxStompTestingModule.watch);

    return {
      provide: RxStompService,
      useValue: rxStompServiceSpy,
    };
  }

  static watch(opts: any): Observable<any> {
    return of();
  }
}

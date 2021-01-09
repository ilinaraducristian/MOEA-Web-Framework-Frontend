import { CommonModule } from '@angular/common';
import { NgModule, Provider } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Observable, of } from 'rxjs';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [NgxIndexedDBTestingModule.forRoot()],
})
export class NgxIndexedDBTestingModule {
  static mockDatabase: any = {};

  static forRoot(): Provider {
    const ngxIndexedDBServiceSpy = jasmine.createSpyObj('NgxIndexedDBService', [
      'add',
      'update',
      'getByID',
      'delete',
    ]);

    ngxIndexedDBServiceSpy.add.and.callFake(NgxIndexedDBTestingModule.add);
    ngxIndexedDBServiceSpy.update.and.callFake(
      NgxIndexedDBTestingModule.update
    );
    ngxIndexedDBServiceSpy.getByID.and.callFake(
      NgxIndexedDBTestingModule.getByID
    );
    ngxIndexedDBServiceSpy.delete.and.callFake(
      NgxIndexedDBTestingModule.delete
    );

    return {
      provide: NgxIndexedDBService,
      useValue: ngxIndexedDBServiceSpy,
    };
  }

  static add(storeName: string, value: any, key?: any): Observable<any> {
    if (NgxIndexedDBTestingModule.mockDatabase[storeName] === undefined) {
      NgxIndexedDBTestingModule.mockDatabase[storeName] = {};
    }
    if (value.id !== undefined) {
      NgxIndexedDBTestingModule.mockDatabase[storeName][value.id] = value;
    } else {
      NgxIndexedDBTestingModule.mockDatabase[storeName][key] = value;
    }
    return of();
  }

  static update(storeName: string, value: any, key?: any): Observable<any> {
    if (NgxIndexedDBTestingModule.mockDatabase[storeName] === undefined) {
      NgxIndexedDBTestingModule.mockDatabase[storeName] = {};
    }
    if (value.id !== undefined) {
      NgxIndexedDBTestingModule.mockDatabase[storeName][value.id] = value;
    } else {
      NgxIndexedDBTestingModule.mockDatabase[storeName][key] = value;
    }
    return of();
  }

  static getByID(storeName: string, id: string | number): Observable<any> {
    if (NgxIndexedDBTestingModule.mockDatabase[storeName] === undefined) {
      NgxIndexedDBTestingModule.mockDatabase[storeName] = {};
    }
    return of(NgxIndexedDBTestingModule.mockDatabase[storeName][id]);
  }

  static delete(storeName: string, key: any): Observable<any> {
    if (NgxIndexedDBTestingModule.mockDatabase[storeName] === undefined) {
      NgxIndexedDBTestingModule.mockDatabase[storeName] = {};
    }
    delete NgxIndexedDBTestingModule.mockDatabase[storeName][key];
    return of();
  }
}

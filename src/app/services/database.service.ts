import {Injectable} from '@angular/core';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {Observable} from 'rxjs';
import {indexedDBConfig} from '../app.module';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends NgxIndexedDBService {

  private readonly storeName = indexedDBConfig.objectStoresMeta[0].store;

  update(value: any): Observable<any[]> {
    return super.update(this.storeName, value);
  }

  add(value: any): Observable<number> {
    return super.add(this.storeName, value);
  }

  getByID(id: string | number): Observable<any> {
    return super.getByID(this.storeName, id);
  }

}





import { TestBed } from '@angular/core/testing';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { NgxIndexedDBTestingModule } from './ngx-Indexed-db-testing.module';

describe('NgxIndexedDBTestingModule', () => {
  let service: NgxIndexedDBService;

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [NgxIndexedDBTestingModule],
    });
    service = TestBed.inject(NgxIndexedDBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a new entry', async () => {
    const storeName = 'store';
    const object = {
      id: 0,
      name: 'name',
    };
    await service.add(storeName, object).toPromise();
    const user = await service.getByID(storeName, 0).toPromise();
    expect(user).toEqual(object);
  });

  it('should update one entry', async () => {
    const storeName = 'store';
    const object = {
      id: 0,
      name: 'newname',
    };
    await service.update(storeName, object).toPromise();
    const user = await service.getByID(storeName, 0).toPromise();
    expect(user).toEqual(object);
  });
});

import { Injectable } from "@angular/core";
import { NgxIndexedDBService } from "ngx-indexed-db";

@Injectable({
  providedIn: "root",
})
export class DatabaseService {
  private indexedDB?: NgxIndexedDBService;

  constructor(private readonly indexedDBService: NgxIndexedDBService) {
    if (window.indexedDB) {
      this.indexedDB = indexedDBService;
    }
  }

  getById(id: string | number): Promise<any> {
    if (this.indexedDB) {
      return this.indexedDB.getByID("users", id);
    } else {
      const object = JSON.parse(localStorage.getItem(`${id}`));
      return Promise.resolve(object);
    }
  }

  add(value: unknown): Promise<void | number> {
    if (this.indexedDB) {
      return this.indexedDB.add("users", value);
    } else {
      localStorage.setItem(`${value["id"]}`, JSON.stringify(value));
      return Promise.resolve();
    }
  }

  update(value: unknown): Promise<any> {
    if (this.indexedDB) {
      return this.indexedDB.update("users", value);
    } else {
      localStorage.setItem(`${value["id"]}`, JSON.stringify(value));
      return Promise.resolve();
    }
  }

  delete(key: any): Promise<any> {
    if (this.indexedDB) {
      return this.indexedDB.delete("users", key);
    } else {
      localStorage.removeItem(`${key}`);
      return Promise.resolve();
    }
  }
}

import { DBConfig } from "ngx-indexed-db";

export const indexedDBConfig: DBConfig = {
  name: "moea",
  version: 1,
  objectStoresMeta: [
    {
      store: "users",
      storeConfig: { keyPath: "id", autoIncrement: false },
      storeSchema: [
        {
          name: "username",
          keypath: "username",
          options: { unique: true }
        },
        {
          name: "email",
          keypath: "email",
          options: { unique: true }
        },
        {
          name: "firstName",
          keypath: "firstName",
          options: { unique: true }
        },
        {
          name: "lastName",
          keypath: "lastName",
          options: { unique: false }
        },
        {
          name: "problems",
          keypath: "problems",
          options: { unique: false }
        },
        {
          name: "algorithms",
          keypath: "algorithms",
          options: { unique: false }
        },
        {
          name: "queue",
          keypath: "queue",
          options: { unique: false }
        }
      ]
    }
  ]
};

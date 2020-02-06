import { DBConfig } from "ngx-indexed-db";
// import { problemsStoreSchema } from "./dtos/problem";

export const indexedDBConfig: DBConfig = {
  name: "moea",
  version: 1,
  objectStoresMeta: [
    {
      store: "problems",
      storeConfig: { keyPath: "id", autoIncrement: true },
      storeSchema: [
        {
          name: "userDefinedName",
          keypath: "userDefinedName",
          options: { unique: false }
        },
        {
          name: "name",
          keypath: "name",
          options: { unique: false }
        },
        {
          name: "algorithm",
          keypath: "algorithm",
          options: { unique: false }
        },
        {
          name: "numberOfEvaluations",
          keypath: "numberOfEvaluations",
          options: { unique: false }
        },
        {
          name: "numberOfSeeds",
          keypath: "numberOfSeeds",
          options: { unique: false }
        }
      ]
    }
  ]
};

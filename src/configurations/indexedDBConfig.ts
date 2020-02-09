import { DBConfig } from "ngx-indexed-db";

export const indexedDBConfig: DBConfig = {
  name: "moea",
  version: 1,
  objectStoresMeta: [
    {
      store: "guestProblems",
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
        },
        {
          name: "status",
          keypath: "status",
          options: { unique: false }
        },
        {
          name: "rabbitId",
          keypath: "rabbitId",
          options: { unique: true }
        },
        {
          name: "solverId",
          keypath: "solverId",
          options: { unique: true }
        }
      ]
    }
  ]
};

import { database } from "@repo/core-util-database/connection";

import { fromPromise } from "xstate";

export const initialiseDatabaseConnection = fromPromise(async () => {
  await database.initialize();
});

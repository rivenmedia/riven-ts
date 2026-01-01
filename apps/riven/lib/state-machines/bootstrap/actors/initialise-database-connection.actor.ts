import { fromPromise } from "xstate";

import { postgresDataSource } from "@repo/core-util-database/connection";

export const initialiseDatabaseConnection = fromPromise(async () => {
  await postgresDataSource.initialize();
});

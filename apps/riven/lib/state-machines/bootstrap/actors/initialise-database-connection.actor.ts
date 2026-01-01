import { postgresDataSource } from "@repo/core-util-database/connection";

import { fromPromise } from "xstate";

export const initialiseDatabaseConnection = fromPromise(async () => {
  await postgresDataSource.initialize();
});

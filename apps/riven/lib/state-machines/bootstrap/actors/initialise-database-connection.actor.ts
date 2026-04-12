import { fromPromise } from "xstate";

import { databaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";

export const initialiseDatabaseConnection = fromPromise(async () => {
  const { orm } = await initORM(databaseConfig);

  // Uncomment to create the initial database schema
  await orm.schema.refresh({
    createSchema: true,
  });
});

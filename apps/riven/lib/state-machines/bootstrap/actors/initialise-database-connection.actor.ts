import { databaseConfig } from "@repo/core-util-database/config";
import { initORM } from "@repo/core-util-database/database";

import { fromPromise } from "xstate";
import z from "zod";

export const initialiseDatabaseConnection = fromPromise(async () => {
  const { orm } = await initORM(databaseConfig);

  // await orm.schema.createSchema();

  if (
    !z.stringbool().parse(process.env["UNSAFE_REFRESH_DATABASE_ON_STARTUP"])
  ) {
    return;
  }

  await orm.schema.refreshDatabase();
});

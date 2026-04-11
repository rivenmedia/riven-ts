import { fromPromise } from "xstate";

import { databaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { settings } from "../../../utilities/settings.ts";

export const initialiseDatabaseConnection = fromPromise(async () => {
  const { orm } = await initORM(databaseConfig);

  // await orm.schema.create();

  if (!settings.unsafeWipeDatabaseOnStartup) {
    return;
  }

  await orm.schema.refresh();
});

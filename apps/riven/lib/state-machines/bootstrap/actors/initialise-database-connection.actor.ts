import { fromPromise } from "xstate";

import { databaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { CompletedShowSeeder } from "../../../database/seeders/shows/completed-show.seeder.ts";
import { settings } from "../../../utilities/settings.ts";

export const initialiseDatabaseConnection = fromPromise(async () => {
  const { orm } = await initORM(databaseConfig);

  // await orm.schema.createSchema();

  if (!settings.unsafeRefreshDatabaseOnStartup) {
    return;
  }

  await orm.schema.refresh();

  await orm.seeder.seed(CompletedShowSeeder);
});

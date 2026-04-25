import { fromPromise } from "xstate";

import { createDatabaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

export const initialiseDatabaseConnection = fromPromise(async () => {
  const databaseConfig = await createDatabaseConfig({
    clientUrl: settings.databaseUrl,
    logger,
    debug: settings.databaseDebugLogging,
  });
  const { database } = await initORM(databaseConfig);

  const requiresMigration = await database.orm.migrator.checkSchema();

  if (!requiresMigration) {
    logger.info("Database is up to date, no migrations needed");

    return;
  }

  logger.info("Running database migrations");

  await database.orm.migrator.up();
});

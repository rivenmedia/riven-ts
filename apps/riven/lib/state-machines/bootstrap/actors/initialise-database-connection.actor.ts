import { fromPromise } from "xstate";

import { createRivenDatabaseConfig } from "../../../database/create-riven-database-config.ts";
import { initORM } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";

export const initialiseDatabaseConnection = fromPromise(async () => {
  const databaseConfig = await createRivenDatabaseConfig();

  const { database } = await initORM(databaseConfig);

  if (process.env["NODE_ENV"] === "production") {
    const requiresMigration = await database.orm.migrator.checkSchema();

    if (!requiresMigration) {
      logger.info("Database is up to date, no migrations needed");

      return;
    }

    logger.info("Running database migrations");

    await database.orm.migrator.up();
  }
});

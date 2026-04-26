import { Migrator } from "@mikro-orm/migrations";
import { readFileSync } from "node:fs";
import { fromPromise } from "xstate";

import { createDatabaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

export const initialiseDatabaseConnection = fromPromise(async () => {
  const databaseConfig = await createDatabaseConfig({
    logger,
  });
  const { database } = await initORM({
    ...databaseConfig,
    clientUrl: settings.databaseUrl,
    debug: settings.databaseDebugLogging,
    driverOptions: {
      ssl: {
        ca: settings.databaseSslRootCert
          ? readFileSync(settings.databaseSslRootCert)
          : undefined,
        cert: settings.databaseSslCert
          ? readFileSync(settings.databaseSslCert)
          : undefined,
        key: settings.databaseSslKey
          ? readFileSync(settings.databaseSslKey)
          : undefined,
      },
    },
    extensions: [Migrator],
  });

  const requiresMigration = await database.orm.migrator.checkSchema();

  if (!requiresMigration) {
    logger.info("Database is up to date, no migrations needed");

    return;
  }

  logger.info("Running database migrations");

  await database.orm.migrator.up();
});

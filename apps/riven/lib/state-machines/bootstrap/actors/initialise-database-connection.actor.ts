import { Migrator } from "@mikro-orm/migrations";
import { readFileSync } from "node:fs";
import { fromPromise } from "xstate";

import { createDatabaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

function createDatabaseSslOptions() {
  const ca = settings.databaseSslRootCert
    ? readFileSync(settings.databaseSslRootCert, "utf8")
    : undefined;
  const cert = settings.databaseSslCert
    ? readFileSync(settings.databaseSslCert, "utf8")
    : undefined;
  const key = settings.databaseSslKey
    ? readFileSync(settings.databaseSslKey, "utf8")
    : undefined;

  if (!ca && !cert && !key) {
    return undefined;
  }

  return {
    ...(ca && { ca }),
    ...(cert && { cert }),
    ...(key && { key }),
  };
}

export const initialiseDatabaseConnection = fromPromise(async () => {
  const databaseConfig = await createDatabaseConfig({
    logger,
  });

  const sslOptions = createDatabaseSslOptions();

  const { database } = await initORM({
    ...databaseConfig,
    clientUrl: settings.databaseUrl,
    debug: settings.databaseDebugLogging,
    ...(sslOptions && {
      driverOptions: {
        ssl: sslOptions,
      },
    }),
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

import { Migrator } from "@mikro-orm/migrations";
import { SeedManager } from "@mikro-orm/seeder";
import { fromPromise } from "xstate";

import { createDatabaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

function createDatabaseSslOptions() {
  const {
    databaseSslRootCert: ca,
    databaseSslCert: cert,
    databaseSslKey: key,
  } = settings;

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
  const sslOptions = createDatabaseSslOptions();

  const databaseConfig = await createDatabaseConfig({
    clientUrl: settings.databaseUrl,
    debug: settings.databaseDebugLogging,
    logger,
    ...(sslOptions && {
      driverOptions: {
        ssl: sslOptions,
      },
    }),
    extensions: [Migrator, SeedManager],
  });

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

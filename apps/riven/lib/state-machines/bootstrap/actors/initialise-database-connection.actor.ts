import { Migrator } from "@mikro-orm/migrations";
import { SeedManager } from "@mikro-orm/seeder";
import { fromPromise } from "xstate";

import { createDatabaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { instanceSettings } from "../../../utilities/instance-settings.ts";
import { logger } from "../../../utilities/logger/logger.ts";

function createDatabaseSslOptions() {
  const {
    databaseSslCert: cert,
    databaseSslKey: key,
    databaseSslRootCert: ca,
  } = instanceSettings.instanceSettings;

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
  const { databaseUrl, databaseDebugLogging } =
    instanceSettings.instanceSettings;

  const databaseConfig = await createDatabaseConfig({
    clientUrl: databaseUrl,
    debug: databaseDebugLogging,
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

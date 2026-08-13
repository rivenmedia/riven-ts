import { Migrator } from "@mikro-orm/migrations";
import { SeedManager } from "@mikro-orm/seeder";

import { logger } from "../utilities/logger/logger.ts";
import { settings } from "../utilities/settings.ts";
import { createDatabaseConfig } from "./config.ts";

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

/**
 * Builds the MikroORM configuration used by the running application.
 *
 * Shared by the bootstrap actor and the Nest database module so the two cannot
 * drift apart while both are able to initialise the connection.
 *
 * @returns The MikroORM configuration
 */
export async function createRivenDatabaseConfig() {
  const sslOptions = createDatabaseSslOptions();

  return createDatabaseConfig({
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
}

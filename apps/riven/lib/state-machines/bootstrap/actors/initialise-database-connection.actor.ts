import { fromPromise } from "xstate";

import { createDatabaseConfig } from "../../../database/config.ts";
import { initORM } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";

export const initialiseDatabaseConnection = fromPromise(async () => {
  await initORM(createDatabaseConfig(logger));
});

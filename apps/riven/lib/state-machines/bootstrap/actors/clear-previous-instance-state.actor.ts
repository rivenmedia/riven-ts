import { fromPromise } from "xstate";

import { database } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

export interface ClearPreviousInstanceStateInput {
  wipeRedis: boolean;
  wipeDatabase: boolean;
}

export const clearPreviousInstanceState = fromPromise<
  undefined,
  ClearPreviousInstanceStateInput
>(async ({ input: { wipeRedis, wipeDatabase } }) => {
  if (wipeRedis) {
    const { RedisConnection } = await import("bullmq");
    const connection = new RedisConnection({
      url: settings.redisUrl,
    });
    const client = await connection.client;

    logger.warn(
      "Clearing all Redis data due to RIVEN_SETTING__unsafeWipeRedisOnStartup being enabled. " +
        "This may lead to data loss if there are pending items in the cache.",
    );

    try {
      await client.flushall();

      logger.info("Redis cleared.");
    } finally {
      await connection.close();
    }
  }

  if (wipeDatabase) {
    logger.warn(
      "Clearing all database data due to RIVEN_SETTING__unsafeWipeDatabaseOnStartup being enabled. " +
        "This may lead to data loss if there are pending items in the database.",
    );

    await database.orm.schema.refresh();

    logger.info("Database cleared.");
  }
});

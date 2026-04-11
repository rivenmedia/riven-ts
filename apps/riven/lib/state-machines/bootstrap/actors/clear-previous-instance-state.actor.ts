import { fromPromise } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

export interface ClearPreviousInstanceStateInput {
  wipeRedis: boolean;
}

export const clearPreviousInstanceState = fromPromise<
  undefined,
  ClearPreviousInstanceStateInput
>(async ({ input: { wipeRedis } }) => {
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

    await client.flushall();

    logger.info("Redis cleared.");
  }
});

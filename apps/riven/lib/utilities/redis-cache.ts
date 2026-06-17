import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { ErrorsAreMissesCache } from "@apollo/utils.keyvaluecache";
import KeyvRedis, { Keyv } from "@keyv/redis";

import { instanceSettings } from "./instance-settings.ts";
import { logger } from "./logger/logger.ts";

export const keyvInstance = new Keyv<string>(
  new KeyvRedis(instanceSettings.instanceSettings.redisUrl),
);

keyvInstance.on("error", (error: unknown) => {
  logger.error("Keyv Redis error:", { err: error });
});

export const redisCache = new ErrorsAreMissesCache(
  new KeyvAdapter<string>(keyvInstance as never),
);

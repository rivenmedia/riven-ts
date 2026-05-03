import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { ErrorsAreMissesCache } from "@apollo/utils.keyvaluecache";
import KeyvRedis, { Keyv } from "@keyv/redis";

import { logger } from "./logger/logger.ts";
import { settings } from "./settings.ts";

export const keyvInstance = new Keyv<string>(new KeyvRedis(settings.redisUrl));

keyvInstance.on("error", (error: unknown) => {
  logger.error("Keyv Redis error:", { err: error });
});

export const redisCache = new ErrorsAreMissesCache(
  new KeyvAdapter<string>(keyvInstance as never),
);

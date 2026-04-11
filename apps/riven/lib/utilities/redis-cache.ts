import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { ErrorsAreMissesCache } from "@apollo/utils.keyvaluecache";
import KeyvRedis, { Keyv } from "@keyv/redis";

import { logger } from "./logger/logger.ts";
import { settings } from "./settings.ts";

const instance = new Keyv<string>(new KeyvRedis(settings.redisUrl));

instance.on("error", (error: unknown) => {
  logger.error("Keyv Redis error:", { err: error });
});

async function killInstance() {
  try {
    await instance.disconnect();

    logger.debug("Keyv Redis connection closed.");
  } catch (error) {
    logger.error("Error closing Keyv Redis connection:", { err: error });
  }
}

for (const signal of ["SIGINT", "SIGTERM", "beforeExit"] as const) {
  process.once(signal, () => {
    void killInstance();
  });
}

export const redisCache = new ErrorsAreMissesCache(
  new KeyvAdapter(instance as never),
);

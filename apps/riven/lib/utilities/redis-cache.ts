import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis, { Keyv } from "@keyv/redis";

import { logger } from "./logger/logger.ts";
import { settings } from "./settings.ts";

const instance = new KeyvRedis(settings.redisUrl);

async function killInstance() {
  try {
    await instance.disconnect();

    logger.debug("Keyv Redis connection closed.");
  } catch (error) {
    logger.error("Error closing Keyv Redis connection:", error);
  }
}

for (const signal of ["SIGINT", "SIGTERM", "beforeExit"] as const) {
  process.once(signal, () => {
    void killInstance();
  });
}

export const redisCache = new KeyvAdapter(new Keyv(instance) as never);

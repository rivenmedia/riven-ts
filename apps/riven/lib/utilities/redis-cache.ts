import { logger } from "@repo/core-util-logger";

import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis, { Keyv } from "@keyv/redis";
import z from "zod";

const instance = new KeyvRedis(z.url().parse(process.env["REDIS_URL"]));

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

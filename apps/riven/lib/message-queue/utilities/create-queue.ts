import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Queue, type QueueOptions } from "bullmq";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";

Queue.setMaxListeners(200);

export function createQueue(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const queue = new Queue(name, {
    ...options,
    connection: {
      url: settings.redisUrl,
    },
    defaultJobOptions: {
      removeOnComplete: {
        age: 60 * 60,
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 60 * 60,
        count: 5000,
      },
    },
    telemetry,
  });

  registerMQListeners(queue, logger);

  return queue;
}

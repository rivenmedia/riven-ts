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
    streams: {
      events: {
        maxLen: 100,
      },
    },
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: { age: 60 * 60 * 24 },
    },
    ...options,
    connection: {
      url: settings.redisUrl,
    },
    telemetry,
  });

  registerMQListeners(queue, logger);

  return queue;
}

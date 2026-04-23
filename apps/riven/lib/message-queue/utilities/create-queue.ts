import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Queue, type QueueOptions } from "bullmq";
import { toMerged } from "es-toolkit";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";

Queue.setMaxListeners(200);

export function createQueue(
  name: string,
  options: Omit<QueueOptions, "connection" | "telemetry"> = {},
) {
  const queue = new Queue(
    name,
    toMerged<QueueOptions, typeof options>(
      {
        defaultJobOptions: {
          removeOnComplete: {
            age: 60 * 60 * 6,
            count: 5000,
          },
          removeOnFail: {
            age: 60 * 60 * 24,
            count: 5000,
          },
        },
        connection: {
          url: settings.redisUrl,
        },
        telemetry,
      },
      options,
    ),
  );

  registerMQListeners(queue, logger);

  return queue;
}

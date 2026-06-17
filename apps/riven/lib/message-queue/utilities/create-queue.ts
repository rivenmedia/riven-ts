import { Queue, type QueueOptions } from "bullmq";
import { toMerged } from "es-toolkit";

import { instanceSettings } from "../../utilities/instance-settings.ts";
import { logger } from "../../utilities/logger/logger.ts";
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
          enableOfflineQueue: false,
          url: instanceSettings.instanceSettings.redisUrl,
        },
        telemetry,
      },
      options,
    ),
  );

  queue.on("error", (error) => {
    logger.error(`${name} queue error`, { err: error });
  });

  return queue;
}

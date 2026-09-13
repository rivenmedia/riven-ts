import { Queue } from "bullmq";
import { toMerged } from "es-toolkit";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { queueRegistry } from "./queue-registry.ts";

import type { QueueOptions } from "bullmq";

Queue.setMaxListeners(200);

export function createQueue(
  name: string,
  options: Omit<QueueOptions, "connection" | "telemetry"> = {},
) {
  const existingQueue = queueRegistry.get(name);

  if (existingQueue) {
    return existingQueue;
  }

  const queue = new Queue(
    name,
    toMerged<QueueOptions, typeof options>(
      {
        connection: {
          enableOfflineQueue: false,
          url: settings.redisUrl,
        },
        telemetry,
      },
      options,
    ),
  );

  queueRegistry.set(name, queue);

  queue.on("error", (error) => {
    logger.error(`${name} queue error`, { err: error });
  });

  return queue;
}

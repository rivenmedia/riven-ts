import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Queue, type QueueOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";

import packageJson from "../../../../../package.json" with { type: "json" };
import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";

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
    telemetry: new BullMQOtel(`riven-queue-${name}`, packageJson.version),
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
  });

  registerMQListeners(queue);

  queue.on("error", logger.error);

  return queue;
}

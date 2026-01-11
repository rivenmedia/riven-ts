import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Queue, type QueueOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import z from "zod";

import packageJson from "../../../../../package.json" with { type: "json" };

Queue.setMaxListeners(200);

export function createQueue(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const queue = new Queue(name, {
    ...options,
    connection: {
      url: z.url().parse(process.env["REDIS_URL"]),
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

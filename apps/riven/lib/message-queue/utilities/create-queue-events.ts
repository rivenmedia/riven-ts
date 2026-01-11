import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { QueueEvents, type QueueOptions } from "bullmq";
import z from "zod";

QueueEvents.setMaxListeners(200);

export function createQueueEvents(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const queueEvents = new QueueEvents(name, {
    ...options,
    connection: {
      url: z.url().parse(process.env["REDIS_URL"]),
    },
  });

  registerMQListeners(queueEvents);

  queueEvents.on("error", logger.error);

  return queueEvents;
}

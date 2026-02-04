import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { QueueEvents, type QueueOptions } from "bullmq";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";

QueueEvents.setMaxListeners(200);

export function createQueueEvents(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const queueEvents = new QueueEvents(name, {
    ...options,
    connection: {
      url: settings.redisUrl,
    },
  });

  registerMQListeners(queueEvents);

  queueEvents.on("error", logger.error);

  return queueEvents;
}

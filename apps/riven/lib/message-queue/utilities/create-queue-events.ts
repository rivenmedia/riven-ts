import { QueueEvents, type QueueOptions } from "bullmq";

import { instanceSettings } from "../../utilities/instance-settings.ts";
import { logger } from "../../utilities/logger/logger.ts";

QueueEvents.setMaxListeners(200);

export function createQueueEvents(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const queueEvents = new QueueEvents(name, {
    ...options,
    connection: {
      url: instanceSettings.instanceSettings.redisUrl,
    },
  });

  queueEvents.on("error", (error) => {
    logger.error(`${name} queue events error`, { err: error });
  });

  return queueEvents;
}

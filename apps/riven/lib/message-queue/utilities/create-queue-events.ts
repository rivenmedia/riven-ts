import { QueueEvents } from "bullmq";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { queueEventsRegistry } from "./queue-events-registry.ts";

import type { QueueOptions } from "bullmq";

QueueEvents.setMaxListeners(200);

export function createQueueEvents(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const existingQueueEvents = queueEventsRegistry.get(name);

  if (existingQueueEvents) {
    return existingQueueEvents;
  }

  const queueEvents = new QueueEvents(name, {
    ...options,
    connection: {
      url: settings.redisUrl,
    },
  });

  queueEventsRegistry.set(name, queueEvents);

  queueEvents.on("error", (error) => {
    logger.error(`${name} queue events error`, { err: error });
  });

  return queueEvents;
}

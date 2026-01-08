import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Queue, type QueueOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import z from "zod";

import packageJson from "../../../../../package.json" with { type: "json" };

Queue.setMaxListeners(20);

export async function createQueue(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const queue = new Queue(name, {
    ...options,
    connection: {
      url: z.url().parse(process.env["REDIS_URL"]),
    },
    telemetry: new BullMQOtel(`riven-queue-${name}`, packageJson.version),
  });

  registerMQListeners(queue);

  queue.on("error", logger.error);

  if (z.stringbool().parse(process.env["CLEAR_QUEUES"])) {
    await queue.obliterate({
      force: true,
    });
  }

  return queue;
}

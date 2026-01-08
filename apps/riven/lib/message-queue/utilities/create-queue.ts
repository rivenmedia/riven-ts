import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Queue, type QueueOptions } from "bullmq";
import z from "zod";

import { telemetry } from "../telemetry.ts";

export async function createQueue(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const queue = new Queue(name, {
    ...options,
    connection: {
      url: z.url().parse(process.env["REDIS_URL"]),
    },
    telemetry,
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

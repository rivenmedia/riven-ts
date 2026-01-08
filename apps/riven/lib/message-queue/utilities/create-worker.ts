import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { type Processor, Worker, type WorkerOptions } from "bullmq";
import z from "zod";

import { telemetry } from "../telemetry.ts";

export function createWorker(
  name: string,
  processor: Processor,
  options?: Omit<WorkerOptions, "connection" | "telemetry">,
) {
  const worker = new Worker(name, processor, {
    ...options,
    connection: {
      url: z.url().parse(process.env["REDIS_URL"]),
    },
    telemetry,
  });

  registerMQListeners(worker);

  worker.on("error", logger.error);

  return worker;
}

import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { type Processor, Worker, type WorkerOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import z from "zod";

import type { Flow } from "../flows/index.ts";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

Worker.setMaxListeners(20);

interface CreateInternalWorkerOptions {
  telemetry?: {
    tracerName: string;
    version?: string;
  };
}

export function createInternalWorker<T extends RivenEvent["type"] | Flow>(
  name: T,
  processor: Processor<ParamsFor<Extract<RivenEvent, { type: T }>>>,
  workerOptions?: Omit<WorkerOptions, "connection" | "telemetry">,
  createInternalWorkerOptions?: CreateInternalWorkerOptions,
) {
  const worker = new Worker(name, processor, {
    ...workerOptions,
    telemetry: new BullMQOtel(
      createInternalWorkerOptions?.telemetry?.tracerName ??
        `riven-worker-${name}`,
      createInternalWorkerOptions?.telemetry?.version,
    ),
    connection: {
      url: z.url().parse(process.env["REDIS_URL"]),
    },
  });

  registerMQListeners(worker);

  worker.on("error", logger.error).on("failed", (_job, err) => {
    logger.error(`[${name}] Error: ${err.message}`);
  });

  return worker;
}

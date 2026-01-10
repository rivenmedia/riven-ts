import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { type Processor, Worker, type WorkerOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import z from "zod";

import type { ParamsFor, RivenEvent } from "@repo/util-plugin-sdk";
import type { PluginToProgramEvent } from "@repo/util-plugin-sdk/plugin-to-program-events";

Worker.setMaxListeners(20);

interface CreatePluginWorkerOptions {
  telemetry?: {
    tracerName: string;
    version?: string;
  };
}

export function createPluginWorker<T extends RivenEvent["type"]>(
  name: `${T}.plugin-${string}`,
  processor: Processor<ParamsFor<Extract<PluginToProgramEvent, { type: T }>>>,
  workerOptions?: Omit<WorkerOptions, "connection" | "telemetry">,
  createPluginWorkerOptions?: CreatePluginWorkerOptions,
) {
  const worker = new Worker(name, processor, {
    ...workerOptions,
    telemetry: new BullMQOtel(
      createPluginWorkerOptions?.telemetry?.tracerName ??
        `riven-plugin-worker-${name}`,
      createPluginWorkerOptions?.telemetry?.version,
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

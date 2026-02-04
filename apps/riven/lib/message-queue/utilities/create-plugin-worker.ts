import {
  type RivenEvent,
  RivenEventHandler,
} from "@repo/util-plugin-sdk/events";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { type Processor, Worker, type WorkerOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import z from "zod";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { createQueue } from "./create-queue.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";

Worker.setMaxListeners(200);

interface CreatePluginWorkerOptions {
  telemetry?: {
    tracerName: string;
    version?: string;
  };
}

export async function createPluginWorker<
  T extends RivenEvent["type"],
  R extends (typeof RivenEventHandler)[T],
>(
  name: T,
  pluginName: string,
  processor: Processor<
    ParamsFor<Extract<RivenEvent, { type: T }>>,
    Awaited<ReturnType<z.infer<R>>>
  >,
  workerOptions?: Omit<WorkerOptions, "connection" | "telemetry">,
  createPluginWorkerOptions?: CreatePluginWorkerOptions,
) {
  const queueName = `${name}.plugin[${pluginName}]`;

  const queue = createQueue(queueName);

  const worker = new Worker(queueName, processor, {
    ...workerOptions,
    telemetry: new BullMQOtel(
      createPluginWorkerOptions?.telemetry?.tracerName ??
        `riven-plugin-worker-${name}`,
      createPluginWorkerOptions?.telemetry?.version,
    ),
    connection: {
      url: settings.redisUrl,
    },
  });

  registerMQListeners(worker);

  worker.on("error", logger.error).on("failed", (_job, err) => {
    logger.error(`[${name}] Error: ${err.message}`);
  });

  if (settings.unsafeClearQueuesOnStartup) {
    await queue.obliterate({
      force: true,
    });
  }

  return {
    queue,
    worker,
  };
}

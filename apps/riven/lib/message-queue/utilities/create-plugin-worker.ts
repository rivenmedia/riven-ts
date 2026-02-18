import {
  type RivenEvent,
  RivenEventHandler,
} from "@repo/util-plugin-sdk/events";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import * as Sentry from "@sentry/node";
import { type Processor, Worker, type WorkerOptions } from "bullmq";
import z from "zod";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createQueue } from "./create-queue.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";

Worker.setMaxListeners(200);

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
) {
  const queueName = `${name}.plugin[${pluginName}]`;

  const queue = createQueue(queueName);

  const worker = new Worker(
    queueName,
    async (job, token, signal) => {
      try {
        return await processor(job as never, token, signal);
      } catch (error) {
        Sentry.captureException(error);

        throw error;
      }
    },
    {
      ...workerOptions,
      connection: {
        url: settings.redisUrl,
      },
      telemetry,
    },
  );

  registerMQListeners(worker, logger);

  worker.on("failed", (_job, error) => {
    logger.error(`[${name}] ${error.message}`);
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

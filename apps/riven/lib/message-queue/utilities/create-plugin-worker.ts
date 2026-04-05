import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import * as Sentry from "@sentry/node";
import { type Processor, Worker, type WorkerOptions } from "bullmq";
import z from "zod";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createQueue } from "./create-queue.ts";

import type {
  RivenEvent,
  RivenEventHandler,
} from "@repo/util-plugin-sdk/events";
import type { ParamsFor } from "@repo/util-plugin-sdk/types/events";

Worker.setMaxListeners(200);

export async function createPluginWorker<
  T extends RivenEvent["type"],
  R extends RivenEventHandler[T],
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
      return await Sentry.withScope(async (scope) => {
        scope.setTags({
          "bullmq.job.id": job.id,
          "bullmq.queue.name": queueName,
          "riven.log.source": pluginName,
          "riven.event.name": name as string,
          "riven.plugin.name": pluginName,
        });

        try {
          return await processor(job as never, token, signal);
        } catch (error) {
          Sentry.captureException(error);

          throw error;
        }
      });
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
    logger.error("Plugin worker encountered an error", { err: error });
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

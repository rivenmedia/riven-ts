import { dataSourceContext } from "@repo/util-plugin-sdk/datasource-context";

import { captureException } from "@sentry/node";
import { Worker } from "bullmq";
import { AbortError } from "es-toolkit";
import assert from "node:assert";

import { withLogContext } from "../../utilities/logger/log-context.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createQueue } from "./create-queue.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  RivenEventHandler,
  RivenEvent,
} from "@repo/util-plugin-sdk/events";
import type { Processor, WorkerOptions } from "bullmq";
import type z from "zod";

Worker.setMaxListeners(200);

export function createPluginWorker<
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
    async (job, token, signal) =>
      new Promise((resolve, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new AbortError(`${job.name} aborted`));
        });

        withLogContext(
          {
            "bullmq.queue.name": queueName,
            "riven.log.source": "plugin",
            "riven.event.name": name,
            "riven.plugin.name": pluginName,
            ...(job.id && { "bullmq.job.id": job.id }),
          },
          async () => {
            try {
              assert.ok(job.token, "Job token is not set");

              return await dataSourceContext.run(
                { job, token: job.token },
                async () => processor(job as never, token, signal),
              );
            } catch (error) {
              captureException(error);

              throw error;
            }
          },
        )
          .then(resolve)
          .catch(reject);
      }),
    {
      ...workerOptions,
      connection: {
        url: settings.redisUrl,
      },
      telemetry,
      removeOnComplete: {
        age: 60 * 60 * 6,
        count: 5000,
      },
      removeOnFail: {
        age: 60 * 60 * 24,
        count: 5000,
      },
    },
  );

  queue.on("error", (error) => {
    logger.error(`${queueName} queue error`, { err: error });
  });

  worker.on("error", (error) => {
    logger.error(`${queueName} worker error`, { err: error });
  });

  worker.on("failed", (_job, error) => {
    if (error instanceof AbortError) {
      return;
    }

    logger.error(`${queueName} failed:`, { err: error });
  });

  return {
    queue,
    worker,
  };
}

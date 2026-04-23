import { dataSourceContext } from "@repo/util-plugin-sdk/datasource-context";
import {
  type RivenEvent,
  RivenEventHandler,
} from "@repo/util-plugin-sdk/events";

import * as Sentry from "@sentry/node";
import { type Processor, Worker, type WorkerOptions } from "bullmq";
import { AbortError } from "es-toolkit";
import assert from "node:assert";
import z from "zod";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createQueue } from "./create-queue.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";

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
    (job, token, signal) => {
      return new Promise((resolve, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new AbortError(`${job.name} aborted`));
        });

        Sentry.withScope(async (scope) => {
          scope.setTags({
            "bullmq.job.id": job.id,
            "bullmq.queue.name": queueName,
            "riven.log.source": pluginName,
            "riven.event.name": name as string,
            "riven.plugin.name": pluginName,
          });

          assert(job.token, "Job token is not set");

          try {
            return await dataSourceContext.run({ job, token: job.token }, () =>
              processor(job as never, token, signal),
            );
          } catch (error) {
            Sentry.captureException(error);

            throw error;
          }
        })
          .then(resolve)
          .catch(reject);
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

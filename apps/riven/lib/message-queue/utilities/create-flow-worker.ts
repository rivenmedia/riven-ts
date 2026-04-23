import * as Sentry from "@sentry/node";
import {
  type QueueOptions,
  UnrecoverableError,
  Worker,
  type WorkerOptions,
} from "bullmq";
import { AbortError, toMerged } from "es-toolkit";
import assert from "node:assert";
import os from "node:os";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createQueue } from "./create-queue.ts";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { ValidPluginMap } from "../../types/plugins.ts";
import type { Flow, FlowHandlers } from "../flows/index.ts";
import type { ZodLiteral, ZodObject, ZodType } from "zod";

Worker.setMaxListeners(200);

export function createFlowWorker<
  T extends ZodObject<{
    name: ZodLiteral<Flow["name"]>;
    input: ZodType;
    output: ZodType;
  }>,
>(
  flowSchema: T,
  processor: ReturnType<
    (typeof FlowHandlers)[T["shape"]["name"]["value"]]["implementAsync"]
  >,
  sendEvent: MainRunnerMachineIntake,
  plugins: ValidPluginMap,
  queueOptions: Omit<QueueOptions, "connection" | "telemetry"> = {},
  workerOptions: Omit<
    WorkerOptions,
    | "connection"
    | "telemetry"
    | "useWorkerThreads"
    | "workerThreadsOptions"
    | "workerForkOptions"
  > = {},
) {
  const [flowName] = flowSchema.shape.name.def.values;

  assert(
    flowName,
    `No queue name found for flow: ${flowSchema.shape.name.value}`,
  );

  const queue = createQueue(flowName, queueOptions);

  const worker = new Worker(
    flowName,
    (job, token, signal) => {
      assert(signal, "Signal is required for flow workers");

      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new AbortError(`${job.name} aborted`));
        });

        Sentry.withScope(async (scope) => {
          scope.setTags({
            "riven.flow.name": flowName,
            "bullmq.queue.name": flowName,
            "bullmq.job.id": job.id,
          });

          try {
            const { services } = await import("../../database/database.ts");

            return await processor(
              {
                job: job as never,
                token,
                signal,
                scope,
              },
              {
                sendEvent,
                services,
                plugins,
              },
            );
          } catch (error) {
            Sentry.captureException(error);

            if (error instanceof Error) {
              throw error;
            }

            throw new UnrecoverableError(String(error));
          }
        })
          .then(resolve)
          .catch(reject);
      });
    },
    toMerged<WorkerOptions, typeof workerOptions>(
      {
        concurrency: os.availableParallelism() * 1.5,
        removeOnComplete: { count: 5000 },
        removeOnFail: {
          age: 60 * 60 * 24,
          count: 5000,
        },
        connection: {
          url: settings.redisUrl,
        },
        telemetry,
      },
      workerOptions,
    ),
  );

  queue.on("error", (error) => {
    logger.error(`${flowName} queue error`, { err: error });
  });

  worker.on("error", (error) => {
    logger.error(`${flowName} worker error`, { err: error });
  });

  worker.on("failed", (_job, error) => {
    if (error instanceof AbortError) {
      return;
    }

    logger.error(`${flowName} failed:`, { err: error });
  });

  return { worker, queue };
}

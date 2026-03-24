import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import * as Sentry from "@sentry/node";
import {
  type QueueOptions,
  UnrecoverableError,
  Worker,
  type WorkerOptions,
} from "bullmq";
import assert from "node:assert";
import os from "node:os";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createQueue } from "./create-queue.ts";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { Flow, FlowHandlers } from "../flows/index.ts";
import type { ZodLiteral, ZodObject, ZodType } from "zod";

Worker.setMaxListeners(200);

export async function createFlowWorker<
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
  queueOptions?: Omit<QueueOptions, "connection" | "telemetry">,
  workerOptions?: Omit<WorkerOptions, "connection" | "telemetry">,
) {
  const [flowName] = flowSchema.shape.name.def.values;

  assert(
    flowName,
    `No queue name found for flow: ${flowSchema.shape.name.value}`,
  );

  const queue = createQueue(flowName, queueOptions);

  const worker = new Worker(
    flowName,
    async (job, token) => {
      return await Sentry.withScope(async (scope) => {
        scope.setTags({
          "riven.flow.name": flowName,
          "bullmq.queue.name": flowName,
          "bullmq.job.id": job.id,
        });

        try {
          return await processor({ job, token, scope } as never, sendEvent);
        } catch (error) {
          Sentry.captureException(error);

          if (error instanceof Error) {
            throw error;
          }

          throw new UnrecoverableError(String(error));
        }
      });
    },
    {
      concurrency: os.availableParallelism(),
      removeOnComplete: { count: 50 },
      removeOnFail: {
        age: 60 * 60 * 24,
        count: 5000,
      },
      ...workerOptions,
      connection: {
        url: settings.redisUrl,
      },
      telemetry,
    },
  );

  registerMQListeners(worker, logger);

  worker.on("failed", (_job, error) => {
    logger.error("Flow worker encountered an error", { err: error });
  });

  if (settings.unsafeClearQueuesOnStartup) {
    await queue.obliterate({
      force: true,
    });
  }

  return { worker, queue };
}

import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import * as Sentry from "@sentry/node";
import { UnrecoverableError, Worker, type WorkerOptions } from "bullmq";
import assert from "node:assert";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
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
  workerOptions?: Omit<WorkerOptions, "connection" | "telemetry">,
) {
  const [flowName] = flowSchema.shape.name.def.values;

  assert(
    flowName,
    `No queue name found for flow: ${flowSchema.shape.name.value}`,
  );

  const worker = new Worker(
    flowName,
    async (job, token) => {
      try {
        return await processor({ job, token } as never, sendEvent);
      } catch (error) {
        Sentry.captureException(error);

        throw new UnrecoverableError(String(error));
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
    logger.error(`[${flowName}] ${error.message}`);
  });

  return worker;
}

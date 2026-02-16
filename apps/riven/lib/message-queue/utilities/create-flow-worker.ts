import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import * as Sentry from "@sentry/node";
import { Worker, type WorkerOptions } from "bullmq";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { Flow, FlowHandlers } from "../flows/index.ts";

Worker.setMaxListeners(200);

export function createFlowWorker<T extends Flow["name"]>(
  name: T,
  processor: ReturnType<(typeof FlowHandlers)[T]["implementAsync"]>,
  sendEvent: MainRunnerMachineIntake,
  workerOptions?: Omit<WorkerOptions, "connection" | "telemetry">,
) {
  const worker = new Worker(name, (job) => processor(job, sendEvent), {
    ...workerOptions,
    connection: {
      url: settings.redisUrl,
    },
    telemetry,
  });

  registerMQListeners(worker, logger);

  worker.on("failed", (_job, error) => {
    logger.error(`[${name}] Error: ${error.message}`);
    Sentry.captureException(error);
  });

  return worker;
}

import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Worker, type WorkerOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { Flow, FlowHandlers } from "../flows/index.ts";

Worker.setMaxListeners(200);

interface CreateFlowWorkerOptions {
  telemetry?: {
    tracerName: string;
    version?: string;
  };
}

export function createFlowWorker<T extends Flow["name"]>(
  name: T,
  processor: ReturnType<(typeof FlowHandlers)[T]["implementAsync"]>,
  sendEvent: MainRunnerMachineIntake,
  workerOptions?: Omit<WorkerOptions, "connection" | "telemetry">,
  createFlowWorkerOptions?: CreateFlowWorkerOptions,
) {
  const worker = new Worker(name, (job) => processor(job, sendEvent), {
    ...workerOptions,
    telemetry: new BullMQOtel(
      createFlowWorkerOptions?.telemetry?.tracerName ?? `riven-worker-${name}`,
      createFlowWorkerOptions?.telemetry?.version,
    ),
    connection: {
      url: settings.redisUrl,
    },
  });

  registerMQListeners(worker);

  worker.on("error", logger.error).on("failed", (_job, err) => {
    logger.error(`[${name}] Error: ${err.message}`);
  });

  return worker;
}

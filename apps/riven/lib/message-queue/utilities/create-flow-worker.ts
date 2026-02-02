import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { Worker, type WorkerOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import z from "zod";

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
  processor: z.infer<(typeof FlowHandlers)[T]>,
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
      url: z.url().parse(process.env["REDIS_URL"]),
    },
  });

  registerMQListeners(worker);

  worker.on("error", logger.error).on("failed", (_job, err) => {
    logger.error(`[${name}] Error: ${err.message}`);
  });

  return worker;
}

import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { type QueueOptions, Worker, type WorkerOptions } from "bullmq";
import assert from "node:assert";
import os from "node:os";
import { URL } from "node:url";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createQueue } from "./create-queue.ts";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { Flow } from "../flows/index.ts";
import type { ZodLiteral, ZodObject, ZodType } from "zod";

Worker.setMaxListeners(200);

export async function createSandboxedWorker(
  flowSchema: ZodObject<{
    name: ZodLiteral<Flow["name"]>;
    input: ZodType;
    output: ZodType;
  }>,
  processor: URL,
  sendEvent: MainRunnerMachineIntake,
  queueOptions?: Omit<QueueOptions, "connection" | "telemetry">,
  workerOptions?: Omit<
    WorkerOptions,
    | "connection"
    | "telemetry"
    | "useWorkerThreads"
    | "workerThreadsOptions"
    | "workerForkOptions"
  >,
) {
  const [flowName] = flowSchema.shape.name.def.values;

  assert(
    flowName,
    `No queue name found for flow: ${flowSchema.shape.name.value}`,
  );

  const queue = createQueue(flowName, queueOptions);

  const worker = new Worker(flowName, processor, {
    concurrency: os.availableParallelism(),
    removeOnComplete: { count: 50 },
    removeOnFail: {
      age: 60 * 60 * 24,
      count: 5000,
    },
    ...workerOptions,
    useWorkerThreads: true,
    workerThreadsOptions: {
      execArgv: [
        "--env-file=.env.riven",
        "--import=@swc-node/register/esm-register",
      ],
    },
    connection: {
      url: settings.redisUrl,
    },
    telemetry,
  });

  registerMQListeners(worker, logger);

  worker.on("completed", (job) => {
    console.log(job.returnvalue);
  });

  worker.on("failed", (_job, error) => {
    logger.error("Sandboxed worker encountered an error", { err: error });
  });

  if (settings.unsafeClearQueuesOnStartup) {
    await queue.obliterate({
      force: true,
    });
  }

  return { worker, queue };
}

import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { type QueueOptions, Worker, type WorkerOptions } from "bullmq";
import assert from "node:assert";
import os from "node:os";
import { URL } from "node:url";

import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";
import { telemetry } from "../../../utilities/telemetry.ts";
import { createQueue } from "../../utilities/create-queue.ts";

import type { SandboxedJobDefinition } from "../../flows/index.ts";
import type { ZodLiteral, ZodObject, ZodType } from "zod";

Worker.setMaxListeners(200);

export async function createSandboxedWorker(
  sandboxedJobSchema: ZodObject<{
    name: ZodLiteral<SandboxedJobDefinition["name"]>;
    input: ZodType;
    output: ZodType;
  }>,
  processorURL: URL,
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
  const [sandboxedJobName] = sandboxedJobSchema.shape.name.def.values;

  assert(
    sandboxedJobName,
    `No queue name found for flow: ${sandboxedJobSchema.shape.name.value}`,
  );

  const queue = createQueue(sandboxedJobName, queueOptions);

  const worker = new Worker(sandboxedJobName, processorURL, {
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
      name: sandboxedJobName,
    },
    connection: {
      url: settings.redisUrl,
    },
    telemetry,
  });

  registerMQListeners(worker, logger);

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

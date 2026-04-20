import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { type QueueOptions, Worker, type WorkerOptions } from "bullmq";
import { toMerged } from "es-toolkit";
import assert from "node:assert";
import { existsSync } from "node:fs";
import { URL } from "node:url";

import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";
import { telemetry } from "../../../utilities/telemetry.ts";
import { createQueue } from "../../utilities/create-queue.ts";

import type { SandboxedJobDefinition } from "../index.ts";
import type { ZodLiteral, ZodObject, ZodType } from "zod";

Worker.setMaxListeners(200);

export function createSandboxedWorker(
  sandboxedJobSchema: ZodObject<{
    name: ZodLiteral<SandboxedJobDefinition["name"]>;
    input: ZodType;
    output: ZodType;
  }>,
  processorURL: URL,
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
  const [sandboxedJobName] = sandboxedJobSchema.shape.name.def.values;

  assert(
    sandboxedJobName,
    `No queue name found for flow: ${sandboxedJobSchema.shape.name.value}`,
  );

  assert(
    existsSync(processorURL),
    `Processor file not found at path: ${processorURL.toString()}`,
  );

  const queue = createQueue(sandboxedJobName, queueOptions);

  const worker = new Worker(
    sandboxedJobName,
    processorURL,
    toMerged<WorkerOptions, typeof workerOptions>(
      {
        removeOnComplete: { count: 5000 },
        removeOnFail: { count: 5000 },
        useWorkerThreads: true,
        workerThreadsOptions: {
          execArgv: ["--env-file=.env.riven"],
          name: `${sandboxedJobName}-worker`,
          workerData: {
            gqlUrl: `http://localhost:${settings.gqlPort.toString()}`,
          },
        },
        connection: {
          url: settings.redisUrl,
        },
        telemetry,
      },
      workerOptions,
    ),
  );

  registerMQListeners(worker, logger);

  worker.on("failed", (_job, error) => {
    logger.error(`${sandboxedJobName} failed:`, { err: error });
  });

  return { worker, queue };
}

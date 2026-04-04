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
import type { Type } from "arktype";

Worker.setMaxListeners(200);

export async function createSandboxedWorker(
  sandboxedJobSchema: Type<{
    name: SandboxedJobDefinition["name"];
    input: Type;
    output: Type;
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
  const sandboxedJobName = sandboxedJobSchema.get("name");

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
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 50 },
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
      },
      workerOptions,
    ),
  );

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

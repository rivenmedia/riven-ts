import * as Sentry from "@sentry/node";
import { type SandboxedJob, UnrecoverableError } from "bullmq";
import { AbortError } from "es-toolkit";
import assert from "node:assert";
import { threadId } from "node:worker_threads";
import { type ZodLiteral, type ZodObject, type ZodType, z } from "zod";

import { initApolloClient } from "../../../graphql/apollo-client.ts";
import { withLogContext } from "../../../utilities/logger/log-context.ts";
import { settings } from "../../../utilities/settings.ts";

import type { SandboxedJobDefinition, SandboxedJobHandlers } from "../index.ts";

const timeoutDuration = 5_000;

function startIdleTimer(duration: number) {
  return setTimeout(() => {
    process.exit(0);
  }, duration);
}

function maybeStopIdleTimer(timerId: NodeJS.Timeout | null) {
  if (timerId) {
    clearTimeout(timerId);
  }

  return null;
}

export function createSandboxedJobProcessor<
  T extends ZodObject<{
    name: ZodLiteral<SandboxedJobDefinition["name"]>;
    input: ZodType;
    output: ZodType;
  }>,
>(
  sandboxedJobSchema: T,
  processor: ReturnType<
    (typeof SandboxedJobHandlers)[T["shape"]["name"]["value"]]["implementAsync"]
  >,
) {
  const [sandboxedJobName] = sandboxedJobSchema.shape.name.def.values;

  assert(
    sandboxedJobName,
    `No queue name found for sandboxed job: ${sandboxedJobSchema.shape.name.value}`,
  );

  let idleTimerId: NodeJS.Timeout | null = null;

  return async (job: SandboxedJob, _token?: string, signal?: AbortSignal) => {
    idleTimerId = maybeStopIdleTimer(idleTimerId);

    return new Promise<z.infer<T["shape"]["output"]>>((resolve, reject) => {
      signal?.addEventListener("abort", () => {
        reject(new AbortError(`${job.name} aborted`));
      });

      withLogContext(
        {
          "riven.log.source": "core",
          "riven.sandboxed-job.name": sandboxedJobName,
          "riven.worker.id": `${sandboxedJobName}:worker-${threadId.toString()}`,
          "bullmq.queue.name": sandboxedJobName,
          "bullmq.job.id": job.id,
        },
        async (scope) => {
          try {
            const client = initApolloClient(
              new URL(`http://localhost:${settings.gqlPort.toString()}`),
              signal,
            );

            const result = (await processor({
              job,
              scope,
              client,
            } as never)) as z.infer<T["shape"]["output"]>;

            await client.clearStore();

            return result;
          } catch (error) {
            Sentry.captureException(error);

            if (error instanceof Error) {
              throw error;
            }

            throw new UnrecoverableError(String(error));
          }
        },
      )
        .then((result) => {
          idleTimerId = startIdleTimer(timeoutDuration);

          resolve(result);
        })
        .catch(reject);
    });
  };
}

import { captureException, getCurrentScope, withScope } from "@sentry/node";
import { type SandboxedJob, UnrecoverableError } from "bullmq";
import assert from "node:assert";
import { type ZodLiteral, type ZodObject, type ZodType, z } from "zod";

import { initApolloClient } from "../../../graphql/apollo-client.ts";

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

const WorkerData = z.object({
  gqlUrl: z.url(),
});

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

  return async (job: SandboxedJob) => {
    idleTimerId = maybeStopIdleTimer(idleTimerId);

    const result = await withScope(async (scope) => {
      const thread = await import("node:worker_threads");

      scope.setTags({
        "riven.log.source": "core",
        "riven.session.id":
          getCurrentScope().getScopeData().tags["riven.session.id"],
        "riven.sandboxed-job.name": sandboxedJobName,
        "riven.worker.id": `${sandboxedJobName}:worker-${thread.threadId.toString()}`,
        "bullmq.queue.name": sandboxedJobName,
        "bullmq.job.id": job.id,
      });

      try {
        const data = WorkerData.parse(thread.workerData);
        const client = initApolloClient(new URL(data.gqlUrl));

        const result = (await processor({
          job,
          scope,
          client,
        } as never)) as z.infer<T["shape"]["output"]>;

        await client.clearStore();

        return result;
      } catch (error) {
        captureException(error);

        if (error instanceof Error) {
          throw error;
        }

        throw new UnrecoverableError(String(error));
      }
    });

    idleTimerId = startIdleTimer(timeoutDuration);

    return result;
  };
}

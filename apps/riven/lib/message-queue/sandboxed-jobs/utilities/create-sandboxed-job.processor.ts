// Load entity definitions via a side-effect import to ensure they're initialised before use
import "@repo/util-plugin-sdk/dto/entities";

import * as Sentry from "@sentry/node";
import { type SandboxedJob, UnrecoverableError } from "bullmq";
import assert from "node:assert";

import type { SandboxedJobDefinition, SandboxedJobHandlers } from "../index.ts";
import type { ZodLiteral, ZodObject, ZodType } from "zod";

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

  return async (job: SandboxedJob) => {
    return await Sentry.withScope(async (scope) => {
      const { threadId } = await import("node:worker_threads");

      scope.setTags({
        "riven.log.source": "core",
        "riven.session.id":
          Sentry.getCurrentScope().getScopeData().tags["riven.session.id"],
        "riven.sandboxed-job.name": sandboxedJobName,
        "riven.worker.id": `${sandboxedJobName}:worker-${threadId.toString()}`,
        "bullmq.queue.name": sandboxedJobName,
        "bullmq.job.id": job.id,
      });

      try {
        return await processor({ job, scope } as never);
      } catch (error) {
        Sentry.captureException(error);

        if (error instanceof Error) {
          throw error;
        }

        throw new UnrecoverableError(String(error));
      }
    });
  };
}

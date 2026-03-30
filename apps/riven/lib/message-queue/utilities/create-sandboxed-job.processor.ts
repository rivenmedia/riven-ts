import * as Sentry from "@sentry/node";
import { type SandboxedJob, UnrecoverableError } from "bullmq";
import assert from "node:assert";

import type { Flow, FlowHandlers } from "../flows/index.ts";
import type { ZodLiteral, ZodObject, ZodType } from "zod";

export function createSandboxedJobProcessor<
  T extends ZodObject<{
    name: ZodLiteral<Flow["name"]>;
    input: ZodType;
    output: ZodType;
  }>,
>(
  flowSchema: T,
  processor: ReturnType<
    (typeof FlowHandlers)[T["shape"]["name"]["value"]]["implementAsync"]
  >,
) {
  const [flowName] = flowSchema.shape.name.def.values;

  assert(
    flowName,
    `No queue name found for flow: ${flowSchema.shape.name.value}`,
  );

  return async (job: SandboxedJob) => {
    console.log("Processing job for flow:", flowName, "with job id:", job.id);
    return await Sentry.withScope(async (scope) => {
      scope.setTags({
        "riven.flow.name": flowName,
        "bullmq.queue.name": flowName,
        "bullmq.job.id": job.id,
      });

      try {
        return await processor(
          { job, token: "", scope } as never,
          (() => {}) as never,
        );
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

import { captureException, getCurrentScope, withScope } from "@sentry/node";
import { type SandboxedJob, UnrecoverableError } from "bullmq";

import type { SandboxedJobDefinition } from "../index.ts";

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
  JobName extends SandboxedJobDefinition["name"],
>(
  sandboxedJobName: JobName,
  processor: Extract<SandboxedJobDefinition, { name: JobName }>["processor"],
) {
  let idleTimerId: NodeJS.Timeout | null = null;

  return async (job: SandboxedJob) => {
    idleTimerId = maybeStopIdleTimer(idleTimerId);

    const result = await withScope(async (scope) => {
      const { threadId } = await import("node:worker_threads");

      scope.setTags({
        "riven.log.source": "core",
        "riven.session.id":
          getCurrentScope().getScopeData().tags["riven.session.id"],
        "riven.sandboxed-job.name": sandboxedJobName,
        "riven.worker.id": `${sandboxedJobName}:worker-${threadId.toString()}`,
        "bullmq.queue.name": sandboxedJobName,
        "bullmq.job.id": job.id,
      });

      try {
        return await processor({ job, scope } as never);
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

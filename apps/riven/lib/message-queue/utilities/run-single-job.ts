import { setTimeout } from "node:timers/promises";

import { createQueueEvents } from "./create-queue-events.ts";
import { createQueue } from "./create-queue.ts";

import type { Job } from "bullmq";

const POLL_INTERVAL_MS = 250;

/**
 * Polls the provided job to check if it has settled.
 *
 * `runSingleJob` uses `job.waitUntilFinished` internally to check for job completion,
 * which only makes a single check for prior completion before looking to queue events.
 *
 * There is a narrow window between these calls where a job can complete and its completion event is missed,
 * so this function serves as a fallback to catch those edge cases.
 *
 * @param job The job whose status should be checked
 * @returns The result of the completed job, or undefined if the polling was aborted
 */
async function pollUntilSettled<DataType, ResultType, JobName extends string>(
  job: Job<DataType, ResultType, JobName>,
) {
  const queue = createQueue(job.queueName);

  while (true) {
    const state = await job.getState();

    if (state === "completed" || state === "failed") {
      const freshJob = await queue.getJob(job.id ?? "");

      if (state === "completed") {
        return freshJob?.returnvalue as ResultType;
      }

      throw new Error(
        freshJob?.failedReason ?? `Job ${job.id ?? "unknown"} failed`,
      );
    }

    await setTimeout(POLL_INTERVAL_MS);
  }
}

export const runSingleJob = async <
  DataType,
  ResultType,
  JobName extends string = string,
>(
  job: Job<DataType, ResultType, JobName>,
  timeout = 600_000,
) => {
  const queueEvents = createQueueEvents(job.queueName);

  return Promise.race([
    pollUntilSettled(job),
    job.waitUntilFinished(queueEvents, timeout),
  ]);
};

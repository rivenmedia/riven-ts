import { createQueueEvents } from "./create-queue-events.ts";

import type { Job } from "bullmq";

export const runSingleJob = async <
  DataType,
  ResultType,
  JobName extends string = string,
>(
  job: Job<DataType, ResultType, JobName>,
) => {
  await using disposer = new AsyncDisposableStack();

  const queueEvents = disposer.adopt(createQueueEvents(job.queueName), (qe) =>
    qe.close(),
  );

  await queueEvents.waitUntilReady();

  return await job.waitUntilFinished(queueEvents, 10_000);
};

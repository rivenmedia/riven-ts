import { createQueueEvents } from "./create-queue-events.ts";

import type { Queue } from "bullmq";

export const runSingleJob = async <
  DataType,
  ResultType,
  JobName extends string = string,
>(
  queue: Queue<DataType, ResultType, JobName, DataType, ResultType, JobName>,
  jobName: JobName,
  jobData: DataType,
) => {
  await using disposer = new AsyncDisposableStack();

  const queueEvents = disposer.adopt(createQueueEvents(queue.name), (qe) =>
    qe.close(),
  );

  await queueEvents.waitUntilReady();

  const job = await queue.add(jobName, jobData);

  return await job.waitUntilFinished(queueEvents, 10_000);
};

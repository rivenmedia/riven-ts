import { queueRegistry } from "#message-queue/utilities/queue-registry.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { Job } from "bullmq";

/**
 * Resolves a job from its Redis key, e.g. `bull:scrape-item:123`.
 *
 * @param key The job's Redis key
 * @returns The job, or `undefined` if its queue is not registered or the job no longer exists
 */
export async function getJobFromKey(key: string) {
  const { queueName, jobId } =
    /^[^:]+:(?<queueName>.+):(?<jobId>[^:]+)$/u.exec(key)?.groups ?? {};

  if (!queueName || !jobId) {
    return;
  }

  return queueRegistry.get(queueName)?.getJob(jobId);
}

async function getUnprocessedChildKeys(
  job: Pick<Job, "getDependencies">,
  cursor = 0,
): Promise<string[]> {
  const { unprocessed = [], nextUnprocessedCursor = 0 } =
    await job.getDependencies({ unprocessed: { cursor, count: 100 } });

  if (nextUnprocessedCursor === 0) {
    return unprocessed;
  }

  return [
    ...unprocessed,
    ...(await getUnprocessedChildKeys(job, nextUnprocessedCursor)),
  ];
}

/**
 * Determines whether a job, or any of its pending descendants, is actively being worked on.
 *
 * @param job The job to check
 * @returns A boolean indicating whether a worker is actively working on the job or its descendants
 */
export async function isJobTreeActive(
  job: Pick<Job, "getState" | "getDependencies">,
): Promise<boolean> {
  const state = await job.getState();

  if (state === "active") {
    return true;
  }

  if (state !== "waiting-children") {
    return false;
  }

  for (const key of await getUnprocessedChildKeys(job)) {
    const child = await getJobFromKey(key);

    if (child && (await isJobTreeActive(child))) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether a media item is currently being processed.
 *
 * A media item is considered to be processing while a worker is actively working on its `process-media-item` job,
 * or any of that job's descendants (e.g. scraping or downloading the item).
 *
 * @param mediaItem The media item to check
 * @returns A boolean indicating whether the media item is being processed
 */
export async function isMediaItemProcessing({
  id,
  type,
}: Pick<MediaItem, "id" | "type">) {
  const queue = queueRegistry.get("process-media-item");

  if (!queue) {
    return false;
  }

  const jobId = await queue.getDeduplicationJobId(`process-${type}-${id}`);

  if (!jobId) {
    return false;
  }

  const job = await queue.getJob(jobId);

  if (!job) {
    return false;
  }

  return isJobTreeActive(job);
}

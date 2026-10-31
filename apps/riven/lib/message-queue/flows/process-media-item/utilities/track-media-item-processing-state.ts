import { pubSub } from "#graphql/pubsub.ts";
import { logger } from "#utilities/logger/logger.ts";

import { getJobFromKey, isJobTreeActive } from "./is-media-item-processing.ts";

import type { ProcessMediaItemFlow } from "../process-media-item.schema.ts";
import type { Job, Worker } from "bullmq";
import type { UUID } from "node:crypto";

type ProcessMediaItemJob = Job<ProcessMediaItemFlow["input"]>;

/**
 * The latest pending publish for each media item, used to publish each item's states in order.
 */
const pendingPublishes = new Map<UUID, Promise<void>>();

/**
 * Finds the `process-media-item` job that the given job belongs to, which may be the job itself.
 */
async function findProcessMediaItemJob(
  job: Pick<Job, "queueName" | "parent">,
): Promise<ProcessMediaItemJob | undefined> {
  if (job.queueName === "process-media-item") {
    return job as ProcessMediaItemJob;
  }

  if (!job.parent?.id) {
    return;
  }

  const parent = await getJobFromKey(`${job.parent.queueKey}:${job.parent.id}`);

  return parent && findProcessMediaItemJob(parent);
}

/**
 * Publishes the processing state of the media item that the given job belongs to, if any.
 *
 * The state is read from the queue when the publish runs, and publishes for the same media item run one at a time,
 * so the latest published state always reflects the latest change.
 *
 * @param job A job that has changed state
 */
export async function publishMediaItemProcessingState(
  job: Pick<Job, "queueName" | "parent">,
) {
  try {
    const processMediaItemJob = await findProcessMediaItemJob(job);

    if (!processMediaItemJob) {
      return;
    }

    const { id } = processMediaItemJob.data.mediaItem;

    const publish = (pendingPublishes.get(id) ?? Promise.resolve()).then(
      async () => {
        pubSub.publish(
          "MEDIA_ITEM_PROCESSING_STATE_CHANGED",
          id,
          await isJobTreeActive(processMediaItemJob),
        );
      },
    );

    pendingPublishes.set(id, publish);

    try {
      await publish;
    } finally {
      if (pendingPublishes.get(id) === publish) {
        pendingPublishes.delete(id);
      }
    }
  } catch (error) {
    logger.warn("Failed to publish media item processing state", {
      err: error,
    });
  }
}

/**
 * Publishes the processing state of a media item whenever a worker starts or stops working on
 * its `process-media-item` job, or any of that job's descendants.
 *
 * Jobs that move to `waiting-children` do not emit a worker event,
 * so {@link publishMediaItemProcessingState} must be called for them separately.
 *
 * @param worker The worker to track
 */
export function trackMediaItemProcessingState(worker: Worker) {
  const handleStateChange = (job: Job | undefined) => {
    if (job) {
      void publishMediaItemProcessingState(job);
    }
  };

  worker.on("active", handleStateChange);
  worker.on("completed", handleStateChange);
  worker.on("failed", handleStateChange);
}

import { logger } from "../../utilities/logger/logger.ts";
import { flow } from "../flows/producer.ts";
import { queueRegistry } from "./queue-registry.ts";

/**
 * Removes a job from the given queue by its deduplication identifier.
 *
 * This is useful when reprocessing jobs, for example after a media item has been re-indexed.
 *
 * @param queueName The queue name in which the job is stored
 * @param deduplicationId The deduplication identifier given to the job that is to be removed
 *
 * @returns A boolean indicating whether the job was successfully removed or not
 */
export async function clearDeduplicationJob(
  queueName: string,
  deduplicationId: string,
) {
  const queue = queueRegistry.get(queueName);

  if (!queue) {
    throw new Error(`Unable to find ${queueName} queue in registry`);
  }

  const deduplicationJobId = await queue.getDeduplicationJobId(deduplicationId);

  if (!deduplicationJobId) {
    return false;
  }

  const deduplicationFlow = await flow.getFlow({
    id: deduplicationJobId,
    queueName,
  });

  try {
    await deduplicationFlow.job.remove();

    return true;
  } catch (error) {
    logger.warn(
      `Failed to remove job with deduplication ID ${deduplicationId} from queue ${queueName}`,
      { err: error },
    );

    return false;
  }
}

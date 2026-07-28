import { flow } from "../flows/producer.ts";
import { queueRegistry } from "./queue-registry.ts";

/**
 * Removes a job from the given queue by its deduplication identifier.
 *
 * This is useful when reprocessing jobs, for example after a media item has been re-indexed.
 *
 * @param queueName The queue name in which the job is stored
 * @param deduplicationId The deduplication identifier given to the job that is to be removed
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

  await deduplicationFlow.job.remove();

  return true;
}

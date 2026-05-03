import assert from "node:assert";

import type { Job, ParentOptions } from "bullmq";

/**
 * Creates a configuration object for a child job that links it to a parent job.
 *
 * Used in flows to allow parent jobs to wait for children jobs to complete.
 *
 * @param job The BullMQ job that should be used as a child job's parent
 * @returns A configuration object that can be used to link a new child job to the given parent
 */
export function createJobParentConfig(
  job: Pick<Job, "id" | "queueQualifiedName">,
): ParentOptions {
  assert(job.id, "Job must have an ID to be used as a parent job");

  return {
    id: job.id,
    queue: job.queueQualifiedName,
  };
}

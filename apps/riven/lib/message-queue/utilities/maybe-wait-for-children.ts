import { WaitingChildrenError } from "bullmq";

import type { Job } from "bullmq";

/**
 * Moves a job to the `waiting-children` state if it has any pending children.
 *
 * If there are no pending children, this is a no-op.
 *
 * @throws {WaitingChildrenError} If the job was moved to the waiting-children state,
 * signalling to BullMQ that processing should halt until its children have completed.
 */
export async function maybeWaitForChildren(
  job: Pick<Job, "moveToWaitingChildren">,
  token: string,
) {
  if (await job.moveToWaitingChildren(token)) {
    throw new WaitingChildrenError();
  }
}

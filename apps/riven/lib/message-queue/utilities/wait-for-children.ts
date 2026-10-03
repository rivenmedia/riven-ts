import { WaitingChildrenError } from "bullmq";

import type { Job } from "bullmq";

/**
 * Moves a job to the waiting-children state, if it has any pending children.
 *
 * @throws {WaitingChildrenError} If the job was moved to the waiting-children state,
 * signalling to BullMQ that processing should halt until its children have completed.
 */
export async function waitForChildren(
  job: Pick<Job, "moveToWaitingChildren">,
  token: string,
) {
  if (await job.moveToWaitingChildren(token)) {
    throw new WaitingChildrenError();
  }
}

import chalk from "chalk";

import { MAX_HEALTH_CHECK_ATTEMPTS } from "#message-queue/flows/request-stream-link/constants.ts";
import { logger } from "#utilities/logger/logger.ts";

import type { StepContext } from "#message-queue/flows/request-stream-link/request-stream-link.processor.ts";
import type { getHealthCheckNextStep } from "#message-queue/flows/request-stream-link/utilities/get-health-check-next-step.ts";

export async function handleExpiredLink(
  { job, mediaEntry, streamService }: StepContext,
  nextStep: ReturnType<typeof getHealthCheckNextStep>,
) {
  if (nextStep === "blacklist-stream") {
    logger.warn(
      `Stream URL for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)} failed to refresh after ${MAX_HEALTH_CHECK_ATTEMPTS.toString()} attempts; blacklisting the stream.`,
    );

    return;
  }

  logger.warn(
    `Stream URL for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)} has expired, attempting to fetch a new stream URL...`,
  );

  if (mediaEntry.streamPermalink) {
    await streamService.clearStreamPermalink(mediaEntry.id);

    // clearStreamPermalink runs in its own request context;
    // mirror it here or the next loop pass re-checks the stale
    // permalink.
    delete mediaEntry.streamPermalink;
  }

  await job.updateData({
    ...job.data,
    healthCheckAttempts: job.data.healthCheckAttempts + 1,
  });
}

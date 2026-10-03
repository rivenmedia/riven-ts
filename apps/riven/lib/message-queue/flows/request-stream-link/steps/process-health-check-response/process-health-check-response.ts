import { MediaItemStreamLinkHealthCheckRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-health-check-requested.event";

import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { z } from "zod";

import { logger } from "../../../../../utilities/logger/logger.ts";
import { filterChildrenFailure } from "../../../../utilities/filter-children-failure.ts";
import { filterChildrenValues } from "../../../../utilities/filter-children-values.ts";
import { getHealthCheckNextStep } from "../../utilities/get-health-check-next-step.ts";
import { handleExpiredLink } from "./utilities/handle-expired-link.ts";

import type { StepContext } from "../../request-stream-link.processor.ts";

export async function processHealthCheckResponse(context: StepContext) {
  const { job, mediaEntry } = context;
  const { success, data, error } =
    MediaItemStreamLinkHealthCheckRequestedResponse.safeParse(
      filterChildrenValues(
        await job.getChildrenValues(),
        "riven.media-item.stream-link.health-check.requested",
        mediaEntry.plugin,
        job.data.healthCheckJobId,
      ),
    );

  if (!success) {
    const failureReason = filterChildrenFailure(
      await job.getIgnoredChildrenFailures(),
      "riven.media-item.stream-link.health-check.requested",
      mediaEntry.plugin,
      job.data.healthCheckJobId,
    );

    if (failureReason) {
      throw new UnrecoverableError(
        `Health check plugin job failed for ${mediaEntry.path}: ${failureReason}`,
      );
    }

    throw new UnrecoverableError(
      `Failed to get health check response from plugin job for ${mediaEntry.path}: ${z.prettifyError(error)}`,
    );
  }

  const nextStep = getHealthCheckNextStep(
    data.state,
    job.data.healthCheckAttempts,
  );

  switch (data.state) {
    case "healthy": {
      logger.debug(
        `Stream URL for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)} is healthy with status code ${data.statusCode.toString()}`,
      );

      break;
    }
    case "expired": {
      await handleExpiredLink(context, nextStep);

      break;
    }
    case "dead":
  }

  await job.updateData({
    ...job.data,
    step: nextStep,
  });
}

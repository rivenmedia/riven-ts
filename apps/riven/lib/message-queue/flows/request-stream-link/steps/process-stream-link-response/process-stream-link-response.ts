import { MediaItemStreamLinkRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";

import { UnrecoverableError } from "bullmq";
import { z } from "zod";

import { filterChildrenFailure } from "../../../../utilities/filter-children-failure.ts";
import { filterChildrenValues } from "../../../../utilities/filter-children-values.ts";

import type { StepContext } from "../../request-stream-link.processor.ts";

export async function processStreamLinkResponse({
  job,
  mediaEntry,
  streamService,
}: StepContext) {
  const { success, data, error } =
    MediaItemStreamLinkRequestedResponse.safeParse(
      filterChildrenValues(
        await job.getChildrenValues(),
        "riven.media-item.stream-link.requested",
        mediaEntry.plugin,
        job.data.streamLinkRequestedJobId,
      ),
    );

  if (!success) {
    const failureReason = filterChildrenFailure(
      await job.getIgnoredChildrenFailures(),
      "riven.media-item.stream-link.requested",
      mediaEntry.plugin,
      job.data.streamLinkRequestedJobId,
    );

    if (failureReason) {
      throw new UnrecoverableError(
        `Stream link plugin job failed for ${mediaEntry.path}: ${failureReason}`,
      );
    }

    throw new UnrecoverableError(
      `Failed to get response from plugin job for ${mediaEntry.path}: ${z.prettifyError(error)}`,
    );
  }

  if (!data.success) {
    const isDeadLink = streamService.isFatalStatusCode(data.statusCode);

    if (isDeadLink) {
      await job.updateData({
        ...job.data,
        step: "blacklist-stream",
      });

      return;
    }

    throw new UnrecoverableError(
      `Plugin failed to generate stream link for ${mediaEntry.path} with status code ${data.statusCode.toString()}`,
    );
  }

  const { data: linkData } = data;

  await job.updateData({
    ...job.data,
    step: "check-link-health",
    linkData,
  });
}

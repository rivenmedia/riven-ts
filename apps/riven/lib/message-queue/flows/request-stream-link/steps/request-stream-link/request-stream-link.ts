import {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";

import chalk from "chalk";

import { logger } from "../../../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../../../utilities/create-job-parent-config.ts";
import { maybeWaitForChildren } from "../../../../utilities/maybe-wait-for-children.ts";
import { flow } from "../../../producer.ts";

import type { StepContext } from "../../request-stream-link.processor.ts";

/**
 * Requests a new stream link from the plugin, unless a cached link or permalink is available.
 *
 * @returns The cached stream link, if one exists
 */
export async function requestStreamLink({
  job,
  token,
  mediaEntry,
  streamService,
}: StepContext) {
  const cachedStreamLink = await streamService.getStreamLink(mediaEntry.id);

  if (cachedStreamLink) {
    logger.debug(
      `Returning cached stream link for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)}`,
    );

    return cachedStreamLink;
  }

  if (mediaEntry.streamPermalink) {
    // Don't re-request links if we already have a permalink,
    // just check the permalink is still healthy
    await job.updateData({
      ...job.data,
      step: "check-link-health",
      linkData: {
        link: mediaEntry.streamPermalink,
        isPermalink: true,
      },
    });

    return null;
  }

  const streamLinkRequestedNode = await flow.addPluginJob(
    MediaItemStreamLinkRequestedEvent,
    MediaItemStreamLinkRequestedResponse,
    `Request stream link: ${mediaEntry.id}`,
    mediaEntry.plugin,
    { item: mediaEntry },
    {
      parent: createJobParentConfig(job),
      ignoreDependencyOnFailure: true,
    },
  );

  await job.updateData({
    ...job.data,
    step: "process-stream-link-response",
    streamLinkRequestedJobId: streamLinkRequestedNode.job.id,
  });

  await maybeWaitForChildren(job, token);

  return null;
}

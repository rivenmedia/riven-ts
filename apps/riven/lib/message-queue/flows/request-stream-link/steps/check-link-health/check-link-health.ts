import {
  MediaItemStreamLinkHealthCheckRequestedEvent,
  MediaItemStreamLinkHealthCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-health-check-requested.event";

import { UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { createJobParentConfig } from "../../../../utilities/create-job-parent-config.ts";
import { maybeWaitForChildren } from "../../../../utilities/maybe-wait-for-children.ts";
import { flow } from "../../../producer.ts";

import type { StepContext } from "../../request-stream-link.processor.ts";

export async function checkLinkHealth({ job, token, mediaEntry }: StepContext) {
  assert.ok(
    job.data.linkData,
    new UnrecoverableError("Stream link data is required to check link health"),
  );

  const healthCheckJobNode = await flow.addPluginJob(
    MediaItemStreamLinkHealthCheckRequestedEvent,
    MediaItemStreamLinkHealthCheckRequestedResponse,
    `Stream URL health check for ${mediaEntry.mediaItem.$.fullTitle}`,
    mediaEntry.plugin,
    {
      item: mediaEntry,
      link: job.data.linkData.link,
    },
    {
      parent: createJobParentConfig(job),
      ignoreDependencyOnFailure: true,
    },
  );

  await job.updateData({
    ...job.data,
    step: "process-health-check-response",
    healthCheckJobId: healthCheckJobNode.job.id,
  });

  await maybeWaitForChildren(job, token);
}

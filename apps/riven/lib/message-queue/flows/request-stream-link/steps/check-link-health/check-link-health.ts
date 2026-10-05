import {
  MediaItemStreamLinkHealthCheckRequestedEvent,
  MediaItemStreamLinkHealthCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-health-check-requested.event";

import { UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { flow } from "#message-queue/flows/producer.ts";
import { createJobParentConfig } from "#message-queue/utilities/create-job-parent-config.ts";
import { maybeWaitForChildren } from "#message-queue/utilities/maybe-wait-for-children.ts";

import type { StepContext } from "#message-queue/flows/request-stream-link/request-stream-link.processor.ts";

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

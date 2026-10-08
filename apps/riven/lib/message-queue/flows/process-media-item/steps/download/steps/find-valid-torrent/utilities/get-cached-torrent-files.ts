import {
  MediaItemDownloadCacheCheckRequestedEvent,
  MediaItemDownloadCacheCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download.cache-check-requested.event";

import { flow } from "#message-queue/flows/producer.ts";
import { runSingleJob } from "#message-queue/utilities/run-single-job.ts";

import type { ParentOptions } from "bullmq";

export async function getCachedTorrentFiles(
  pluginName: string,
  infoHashes: string[],
  parent: ParentOptions,
  provider: string | null,
) {
  const providerLabel = provider ? ` on ${provider}` : "";
  const node = await flow.addPluginJob(
    MediaItemDownloadCacheCheckRequestedEvent,
    MediaItemDownloadCacheCheckRequestedResponse,
    `Find cached torrents for ${pluginName}${providerLabel}`,
    pluginName,
    { infoHashes, provider },
    {
      jobId: `${infoHashes.join(",")}-cache-check-${pluginName}-${provider ?? ""}`,
      removeDependencyOnFailure: true,
      parent,
    },
  );

  return runSingleJob(node.job);
}

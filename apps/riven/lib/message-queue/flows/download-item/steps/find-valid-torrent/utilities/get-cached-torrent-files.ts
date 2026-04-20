import {
  MediaItemDownloadCacheCheckRequestedEvent,
  MediaItemDownloadCacheCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download.cache-check-requested.event";

import { runSingleJob } from "../../../../../utilities/run-single-job.ts";
import { flow } from "../../../../producer.ts";

import type { ParentOptions } from "bullmq";

export async function getCachedTorrentFiles(
  pluginName: string,
  infoHashes: string[],
  parent: ParentOptions,
  provider: string | null,
) {
  const node = await flow.addPluginJob(
    MediaItemDownloadCacheCheckRequestedEvent,
    MediaItemDownloadCacheCheckRequestedResponse,
    `Find cached torrents for ${pluginName}${provider ? ` on ${provider}` : ""}`,
    pluginName,
    { infoHashes: infoHashes, provider },
    {
      jobId: `${infoHashes.join(",")}-cache-check-${pluginName}-${provider ?? ""}`,
      removeDependencyOnFailure: true,
      parent,
    },
  );

  return runSingleJob(node.job);
}

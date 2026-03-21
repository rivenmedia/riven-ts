import {
  MediaItemDownloadCacheCheckRequestedEvent,
  MediaItemDownloadCacheCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download.cache-check-requested.event";

import { runSingleJob } from "../../../../../utilities/run-single-job.ts";
import { flow } from "../../../../producer.ts";

import type { ParentOptions } from "bullmq";

export async function getCachedTorrentFiles(
  pluginName: string,
  infoHash: string,
  parent: ParentOptions,
  provider: string | null,
) {
  const pluginCacheCheckNode = await flow.addPluginJob(
    MediaItemDownloadCacheCheckRequestedEvent,
    MediaItemDownloadCacheCheckRequestedResponse,
    `Find cached torrents for ${pluginName}${provider ? ` on ${provider}` : ""}`,
    pluginName,
    { infoHashes: [infoHash], provider },
    {
      jobId: `${infoHash}-cache-check-${pluginName}-${provider ?? ""}`,
      removeDependencyOnFailure: true,
      parent,
    },
  );

  const pluginCacheCheckResult = await runSingleJob(
    pluginCacheCheckNode.job,
    60_000,
  );

  return pluginCacheCheckResult[infoHash];
}

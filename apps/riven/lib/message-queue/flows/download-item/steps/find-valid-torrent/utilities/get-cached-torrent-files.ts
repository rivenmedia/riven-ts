import {
  MediaItemDownloadCacheCheckRequestedEvent,
  MediaItemDownloadCacheCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download.cache-check-requested.event";

import { runSingleJob } from "../../../../../utilities/run-single-job.ts";
import { flow } from "../../../../producer.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { ParentOptions, PluginJobNode } from "bullmq";

export async function getCachedTorrentFiles(
  pluginName: string,
  infoHashes: string[],
  parent: ParentOptions,
  provider: string | null,
) {
  const nodes: Promise<
    PluginJobNode<
      ParamsFor<MediaItemDownloadCacheCheckRequestedEvent>,
      MediaItemDownloadCacheCheckRequestedResponse
    >
  >[] = [];

  const chunkSize = 500;

  for (let i = 0; i < infoHashes.length; i += chunkSize) {
    const chunk = infoHashes.slice(i, i + chunkSize);

    nodes.push(
      flow.addPluginJob(
        MediaItemDownloadCacheCheckRequestedEvent,
        MediaItemDownloadCacheCheckRequestedResponse,
        `Find cached torrents for ${pluginName}${provider ? ` on ${provider}` : ""}`,
        pluginName,
        { infoHashes: chunk, provider },
        {
          jobId: `${chunk.join(",")}-cache-check-${pluginName}-${provider ?? ""}`,
          removeDependencyOnFailure: true,
          parent,
        },
      ),
    );
  }

  const pluginCacheCheckNodes = await Promise.all(nodes);
  const pluginCacheCheckResults = await Promise.all(
    pluginCacheCheckNodes.map((node) => runSingleJob(node.job)),
  );

  return pluginCacheCheckResults.reduce(
    (acc, result) => Object.assign(acc, result),
    {},
  );
}

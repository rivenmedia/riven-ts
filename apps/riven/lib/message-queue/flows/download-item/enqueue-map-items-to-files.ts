import { MediaItemDownloadRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import {
  type MapItemsToFilesFlow,
  createMapItemsToFilesJob,
} from "./steps/map-items-to-files/map-items-to-files.schema.ts";

import type { ParentOptions, PluginJobNode } from "bullmq";

export interface EnqueueMapItemsToFilesInput {
  parent: ParentOptions;
  infoHash: string;
  plugin: string;
}

export async function enqueueMapItemsToFiles({
  parent,
  infoHash,
  plugin,
}: EnqueueMapItemsToFilesInput): Promise<
  PluginJobNode<MapItemsToFilesFlow["input"], MapItemsToFilesFlow["output"]>
> {
  const jobId = infoHash; // Use info hash as job ID to prevent duplicate processing of the same torrent container

  const pluginDownloadNode = createPluginFlowJob(
    MediaItemDownloadRequestedEvent,
    `Download ${infoHash}`,
    plugin,
    { infoHash },
    {
      jobId,
      ignoreDependencyOnFailure: true,
    },
  );

  const rootNode = createMapItemsToFilesJob(
    `Mapping items to file indexes for ${infoHash}`,
    {
      opts: {
        jobId,
        parent,
        removeOnFail: true,
      },
      children: [pluginDownloadNode],
    },
  );

  return flow.add(rootNode);
}

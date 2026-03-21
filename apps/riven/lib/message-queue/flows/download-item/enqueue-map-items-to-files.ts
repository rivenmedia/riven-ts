import { flow } from "../producer.ts";
import {
  type MapItemsToFilesFlow,
  createMapItemsToFilesJob,
} from "./steps/map-items-to-files/map-items-to-files.schema.ts";

import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import type { ParentOptions, PluginJobNode } from "bullmq";

export interface EnqueueMapItemsToFilesInput {
  parent: ParentOptions;
  infoHash: string;
  files: DebridFile[];
  jobId: string;
}

export function enqueueMapItemsToFiles({
  parent,
  infoHash,
  files,
  jobId,
}: EnqueueMapItemsToFilesInput): Promise<
  PluginJobNode<MapItemsToFilesFlow["input"], MapItemsToFilesFlow["output"]>
> {
  const rootNode = createMapItemsToFilesJob(
    `Mapping items to file indexes for ${infoHash}`,
    { files },
    {
      opts: {
        jobId,
        parent,
        removeDependencyOnFailure: true,
      },
    },
  );

  return flow.add(rootNode);
}

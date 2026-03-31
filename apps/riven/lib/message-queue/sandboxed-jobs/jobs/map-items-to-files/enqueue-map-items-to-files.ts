import { flow } from "../../../flows/producer.ts";
import {
  type MapItemsToFilesSandboxedJob,
  createMapItemsToFilesJob,
} from "./map-items-to-files.schema.ts";

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
  PluginJobNode<
    MapItemsToFilesSandboxedJob["input"],
    MapItemsToFilesSandboxedJob["output"]
  >
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

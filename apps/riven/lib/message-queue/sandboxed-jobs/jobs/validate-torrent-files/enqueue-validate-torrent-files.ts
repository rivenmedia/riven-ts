import { flow } from "../../../flows/producer.ts";
import { createMapItemsToFilesJob } from "../map-items-to-files/map-items-to-files.schema.ts";
import {
  type ValidateTorrentFilesSandboxedJob,
  createValidateTorrentFilesJob,
} from "./validate-torrent-files.schema.ts";

import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import type { ParentOptions, PluginJobNode } from "bullmq";
import type { UUID } from "node:crypto";

export interface EnqueueValidateTorrentFilesInput {
  parent: ParentOptions;
  mediaItemId: UUID;
  infoHash: string;
  files: DebridFile[];
  isCacheCheck: boolean;
}

export function enqueueValidateTorrentFiles({
  parent,
  infoHash,
  files,
  mediaItemId,
  isCacheCheck,
}: EnqueueValidateTorrentFilesInput): Promise<
  PluginJobNode<
    ValidateTorrentFilesSandboxedJob["input"],
    ValidateTorrentFilesSandboxedJob["output"]
  >
> {
  const mapItemsToFilesNode = createMapItemsToFilesJob(
    `Mapping items to file indexes for ${infoHash}`,
    { files },
    {
      opts: {
        jobId: `${mediaItemId}-${infoHash}-map-items-to-files-${isCacheCheck ? "cached" : "downloaded"}`,
        removeDependencyOnFailure: true,
      },
    },
  );

  const rootNode = createValidateTorrentFilesJob(
    `Validating torrent files for ${infoHash}`,
    {
      infoHash,
      id: mediaItemId,
      isCacheCheck,
    },
    {
      opts: {
        jobId: `${mediaItemId}-${infoHash}-validate-torrent-files-${isCacheCheck ? "cached" : "downloaded"}`,
        parent,
        removeDependencyOnFailure: true,
      },
      children: [mapItemsToFilesNode],
    },
  );

  return flow.add(rootNode);
}

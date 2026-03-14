import { runSingleJob } from "../../../../../utilities/run-single-job.ts";
import { enqueueMapItemsToFiles } from "../../../enqueue-map-items-to-files.ts";
import { validateTorrentFiles } from "./validate-torrent-files.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import type { ParentOptions } from "bullmq";

export async function getValidTorrentFiles(
  item: MediaItem,
  infoHash: string,
  files: DebridFile[],
  isCachedFiles: boolean,
  parent: ParentOptions,
) {
  const mapItemsNode = await enqueueMapItemsToFiles({
    parent,
    infoHash,
    files,
    jobId: `${infoHash}-map-items-to-files-${isCachedFiles ? "cached" : "downloaded"}`,
  });

  const mappedTorrentFiles = await runSingleJob(mapItemsNode.job);

  return validateTorrentFiles(
    item,
    infoHash,
    mappedTorrentFiles,
    isCachedFiles,
  );
}

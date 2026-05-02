import { enqueueValidateTorrentFiles } from "../../../../../../../sandboxed-jobs/jobs/validate-torrent-files/enqueue-validate-torrent-files.ts";
import { InvalidTorrentError } from "../../../../../../../sandboxed-jobs/jobs/validate-torrent-files/utilities/validate-torrent-files.ts";
import { runSingleJob } from "../../../../../../../utilities/run-single-job.ts";

import type { MediaItem } from "@rivenmedia/plugin-sdk/dto/entities";
import type { DebridFile } from "@rivenmedia/plugin-sdk/schemas/torrents/debrid-file";
import type { ParentOptions } from "bullmq";

export async function getValidTorrentFiles(
  item: MediaItem,
  infoHash: string,
  files: DebridFile[],
  isCachedFiles: boolean,
  parent: ParentOptions,
) {
  const validateTorrentFilesNode = await enqueueValidateTorrentFiles({
    parent,
    infoHash,
    files,
    mediaItemId: item.id,
    isCacheCheck: isCachedFiles,
  });

  const result = await runSingleJob(validateTorrentFilesNode.job);

  if (!result.success) {
    throw new InvalidTorrentError(result.reason);
  }

  return result.files;
}

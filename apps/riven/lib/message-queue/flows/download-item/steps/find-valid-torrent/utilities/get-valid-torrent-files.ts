import { enqueueValidateTorrentFiles } from "../../../../../sandboxed-jobs/jobs/validate-torrent-files/enqueue-validate-torrent-files.ts";
import { InvalidTorrentError } from "../../../../../sandboxed-jobs/jobs/validate-torrent-files/utilities/validate-torrent-files.ts";
import { runSingleJob } from "../../../../../utilities/run-single-job.ts";

import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import type { ParentOptions } from "bullmq";
import type { UUID } from "node:crypto";

export async function getValidTorrentFiles(
  itemId: UUID,
  infoHash: string,
  files: DebridFile[],
  isCachedFiles: boolean,
  parent: ParentOptions,
) {
  const validateTorrentFilesNode = await enqueueValidateTorrentFiles({
    parent,
    infoHash,
    files,
    mediaItemId: itemId,
    isCacheCheck: isCachedFiles,
  });

  const result = await runSingleJob(validateTorrentFilesNode.job);

  if (!result.success) {
    throw new InvalidTorrentError(result.reason);
  }

  return result.files;
}

import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";

import { FuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { Queue } from "bullmq";

let fd = 0;

async function open(
  path: string,
  _flags: number,
  queues: Map<symbol, Map<RivenEvent["type"], Queue>>,
) {
  const { tmdbId } = PathInfo.parse(path);

  if (!tmdbId) {
    throw new FuseError(Fuse.ENOENT, `Invalid path for open: ${path}`);
  }

  const item = await database.mediaEntry.findOneOrFail({
    mediaItem: {
      tmdbId,
    },
  });

  console.log({ queues });

  if (!item.unrestrictedUrl) {
    throw new FuseError(
      Fuse.ENOENT,
      `Media entry ${item.id.toString()} has no unrestricted URL`,
    );
  }

  const nextFd = fd++;

  fileNameToFileChunkCalculationsMap.set(
    item.originalFilename,
    calculateFileChunks(item.id, Number(item.fileSize)),
  );

  fdToFileHandleMeta.set(nextFd, {
    fileId: item.id,
    fileSize: item.fileSize.toString(),
    filePath: path,
    fileName: item.originalFilename,
    url: item.unrestrictedUrl,
  });

  logger.debug(`Opened file at path ${path} with fd ${nextFd.toString()}`);

  return nextFd;
}

export const openSync = function (
  path: string,
  flags: number,
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>,
  callback: (err: number, fd?: number) => void,
) {
  open(path, flags, pluginQueues)
    .then(callback.bind(null, 0))
    .catch((error: unknown) => {
      logger.error(`VFS open error: ${(error as Error).message}`);

      callback(Fuse.EIO);
    });
};

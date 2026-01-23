import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";

import { FuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { fdToFileHandleMeta } from "../utilities/file-handle-map.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

let fd = 0;

async function open(path: string, _flags: number) {
  const { tmdbId } = PathInfo.parse(path);

  if (!tmdbId) {
    throw new FuseError(Fuse.ENOENT, `Invalid path for open: ${path}`);
  }

  const item = await database.mediaEntry.findOneOrFail({
    mediaItem: {
      tmdbId,
    },
  });

  if (!item.unrestrictedUrl) {
    throw new FuseError(
      Fuse.ENOENT,
      `Media entry ${item.id.toString()} has no unrestricted URL`,
    );
  }

  const nextFd = fd++;

  fdToFileHandleMeta.set(nextFd, {
    fileId: item.id,
    fileSize: item.fileSize,
    filePath: path,
    url: item.unrestrictedUrl,
  });

  logger.debug(`Opened file at path ${path} with fd ${nextFd.toString()}`);

  return nextFd;
}

export const openSync = function (path, flags, callback) {
  open(path, flags)
    .then(callback.bind(null, 0))
    .catch((error: unknown) => {
      logger.error(`VFS open error: ${(error as Error).message}`);

      callback(Fuse.EIO);
    });
} satisfies OPERATIONS["open"];

import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";
import { LRUCache } from "lru-cache";
import { Client, interceptors } from "undici";

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
  const { pathname, origin } = new URL(item.unrestrictedUrl);

  const client = new Client(origin).compose(interceptors.deduplicate());

  fdToFileHandleMeta.set(nextFd, {
    fileSize: item.fileSize,
    filePath: path,
    url: item.unrestrictedUrl,
    client,
    pathname,
    cache: new LRUCache<`${string}-${string}`, Buffer[]>({
      maxSize: Math.pow(1024, 3) * 2,
      sizeCalculation: (value, _key) => {
        return value.reduce((acc, buf) => acc + buf.byteLength, 0);
      },
    }),
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

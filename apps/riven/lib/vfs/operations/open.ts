import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";

import { Client, interceptors } from "undici";

import { PathInfo } from "../schemas/path-info.ts";
import { fdToFileHandleMeta } from "../utilities/file-handle-map.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

let fd = 0;

async function open(path: string, _flags: number) {
  const { tmdbId } = PathInfo.parse(path);

  if (!tmdbId) {
    throw new Error(`Invalid path for open: ${path}`);
  }

  const item = await database.mediaEntry.findOneOrFail({
    mediaItem: {
      tmdbId,
    },
  });

  if (!item.unrestrictedUrl) {
    throw new Error(
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
  });

  logger.debug(`Opened file at path ${path} with fd ${nextFd.toString()}`);

  return nextFd;
}

export const openSync = function (path, flags, callback) {
  open(path, flags)
    .then(callback.bind(null, 0))
    .catch((error: unknown) => {
      console.error("Error during open:", error);
    });
} satisfies OPERATIONS["open"];

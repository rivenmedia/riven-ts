import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS, type Stats } from "@zkochan/fuse-native";
import { LRUCache } from "lru-cache";
import fs, { type PathLike } from "node:fs";
import z from "zod";

import { config } from "../config.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { isHiddenPath } from "../utilities/is-hidden-path.ts";
import { isIgnoredPath } from "../utilities/is-ignored-path.ts";

import type { SetOptional } from "type-fest";

const attrCache = new LRUCache<PathLike, Partial<Stats>>({
  ttl: 5000,
  ttlAutopurge: false,
});

type StatMode = "dir" | "file" | "link" | number;

export function parseMode(mode: StatMode): number {
  if (typeof mode === "number") {
    return mode;
  }

  switch (mode) {
    case "dir":
      return fs.constants.S_IFDIR | 0o755;
    case "file":
      return fs.constants.S_IFREG | 0o644;
    case "link":
      return fs.constants.S_IFLNK | 0o755;
    default:
      return 0;
  }
}

type StatInput = SetOptional<
  Omit<
    Stats,
    "mode" | "size" | "blksize" | "dev" | "nlink" | "rdev" | "ino" | "blocks"
  >,
  "gid" | "uid"
> & {
  mode: StatMode;
} & (
    | {
        mode: Extract<StatMode, "dir">;
        size?: never;
      }
    | {
        mode: Exclude<StatMode, "dir">;
        size: number;
      }
  );

const stat = (st: StatInput) => {
  const gid =
    st.gid ?? process.getgid?.() ?? z.int().parse(process.env["PGID"]);
  const uid =
    st.uid ?? process.getuid?.() ?? z.int().parse(process.env["PUID"]);

  return {
    ...st,
    gid,
    uid,
    mode: parseMode(st.mode),
    size: st.mode === "dir" ? 0 : st.size,
    blksize: config.blockSize,
    blocks: 1,
    nlink: st.mode === "dir" ? 2 : 1,
  } satisfies Partial<Stats>;
};

async function getattr(path: string) {
  const maybeCachedAttr = attrCache.get(path);

  if (maybeCachedAttr) {
    logger.silly(`VFS getattr: Cache hit for path ${path}`);

    return maybeCachedAttr;
  }

  switch (path) {
    case "/":
    case "/movies":
    case "/shows": {
      return stat({
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        mode: "dir",
      });
    }
  }

  const pathInfo = PathInfo.parse(path);
  const entityType = config.childQueryType[pathInfo.type];

  if (!pathInfo.tmdbId) {
    throw new FuseError(Fuse.ENOENT, `Invalid path: ${path}`);
  }

  const entry = await database.filesystemEntry.findOneOrFail({
    mediaItem: {
      tmdbId: pathInfo.tmdbId,
      type: entityType,
    },
  });

  const attrs = stat({
    ctime: entry.createdAt,
    atime: entry.updatedAt ?? entry.createdAt,
    mtime: entry.updatedAt ?? entry.createdAt,
    ...(pathInfo.isFile
      ? {
          size: entry.fileSize,
          mode: "file",
        }
      : { mode: "dir" }),
  });

  attrCache.set(path, attrs);

  logger.silly(`VFS getattr: Cache miss for path ${path}`);

  return attrs;
}

export const getattrSync = function (path, callback) {
  if (isHiddenPath(path) || isIgnoredPath(path)) {
    logger.silly(`VFS getattr: Skipping hidden/ignored path ${path}`);

    process.nextTick(callback, Fuse.EBADF);

    return;
  }

  getattr(path)
    .then((stats) => {
      process.nextTick(callback, null, stats);
    })
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS getattr FuseError: ${error.message}`);

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error(`VFS getattr unknown error: ${String(error)}`);

      process.nextTick(callback, Fuse.ENOENT);
    });
} satisfies OPERATIONS["getattr"];

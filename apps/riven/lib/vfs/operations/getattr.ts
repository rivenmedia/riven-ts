import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS, type Stats } from "@zkochan/fuse-native";
import z from "zod";

import { config } from "../config.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { isHiddenPath } from "../utilities/is-hidden-path.ts";
import { isIgnoredPath } from "../utilities/is-ignored-path.ts";

import type { SetOptional } from "type-fest";

type StatMode = "dir" | "file" | "link" | number;

function parseMode(mode: StatMode): number {
  if (typeof mode === "number") {
    return mode;
  }

  switch (mode) {
    case "dir":
      return 0o40_000;
    case "file":
      return 0o100_000;
    case "link":
      return 0o120_000;
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
    blksize: 0,
    dev: 0,
    nlink: 1,
    rdev: 0,
    ino: 0,
    blocks: Math.ceil((st.size ?? 0) / 131072),
  } satisfies Stats;
};

async function getattr(path: string) {
  if (isHiddenPath(path)) {
    logger.silly(`VFS getattr: Skipping hidden path ${path}`);

    return;
  }

  if (isIgnoredPath(path)) {
    logger.silly(`VFS getattr: Skipping ignored path ${path}`);

    return;
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

  return stat({
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
}

export const getattrSync = function (path, callback) {
  getattr(path)
    .then(callback.bind(null, 0))
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS getattr FuseError: ${error.message}`);

        callback(error.errorCode);

        return;
      }

      logger.error(`VFS getattr unknown error: ${String(error)}`);

      callback(Fuse.ENOENT);
    });
} satisfies OPERATIONS["getattr"];

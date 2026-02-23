import Fuse, { type OPERATIONS, type Stats } from "@zkochan/fuse-native";
import { DateTime } from "luxon";
import fs from "node:fs";
import { isZodErrorLike } from "zod-validation-error";

import { database } from "../../database/database.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { isHiddenPath } from "../utilities/is-hidden-path.ts";
import { isIgnoredPath } from "../utilities/is-ignored-path.ts";

import type { SetOptional } from "type-fest";

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

const stat = (st: StatInput, subDirectoryCount = 0) => {
  const gid = st.gid ?? process.getgid?.() ?? 0;
  const uid = st.uid ?? process.getuid?.() ?? 0;
  const nlink = st.mode === "dir" ? 2 + subDirectoryCount : 1;

  return {
    ...st,
    gid,
    uid,
    mode: parseMode(st.mode),
    size: st.mode === "dir" ? 0 : st.size,
    nlink,
  } satisfies Partial<Stats>;
};

function getEntry(pathInfo: PathInfo) {
  switch (pathInfo.pathType) {
    case "single-movie": {
      if (!pathInfo.tmdbId) {
        throw new TypeError("Missing tmdbId for movie path");
      }

      return database.movie.findOneOrFail(
        { tmdbId: pathInfo.tmdbId },
        { fields: ["createdAt", "updatedAt", "filesystemEntries.fileSize"] },
      );
    }
    case "single-episode": {
      if (!pathInfo.tvdbId || !pathInfo.season || !pathInfo.episode) {
        throw new TypeError(
          "Missing tvdbId, season, or episode for episode path",
        );
      }

      return database.episode.findOneOrFail(
        {
          season: {
            number: pathInfo.season,
            show: {
              tvdbId: pathInfo.tvdbId,
            },
          },
          number: pathInfo.episode,
        },
        { fields: ["createdAt", "updatedAt", "filesystemEntries.fileSize"] },
      );
    }
    case "show-seasons": {
      if (!pathInfo.tvdbId) {
        throw new TypeError("Missing tvdbId for show seasons path");
      }

      return database.show.findOneOrFail({
        tvdbId: pathInfo.tvdbId,
      });
    }
    case "season-episodes": {
      if (!pathInfo.tvdbId || !pathInfo.season) {
        throw new TypeError(
          "Missing tvdbId or season for season episodes path",
        );
      }

      return database.season.findOneOrFail(
        {
          show: {
            tvdbId: pathInfo.tvdbId,
          },
          number: pathInfo.season,
        },
        { populate: ["*"] },
      );
    }
    case "all-shows":
    case "all-movies":
      return null;
  }
}

async function getattr(path: string) {
  switch (path) {
    case "/": {
      const oldestEntry = await database.mediaEntry.findOne(
        { type: "media" },
        {
          orderBy: {
            createdAt: "asc nulls last",
          },
          fields: ["createdAt"],
        },
      );

      const mostRecentlyUpdatedEntry = await database.mediaEntry.findOne(
        { type: "media" },
        {
          orderBy: {
            updatedAt: "desc nulls last",
          },
          fields: ["updatedAt"],
        },
      );

      return stat(
        {
          mtime:
            mostRecentlyUpdatedEntry?.updatedAt ??
            oldestEntry?.createdAt ??
            DateTime.now().toJSDate(),
          atime:
            mostRecentlyUpdatedEntry?.updatedAt ??
            oldestEntry?.createdAt ??
            DateTime.now().toJSDate(),
          ctime: oldestEntry?.createdAt ?? DateTime.now().toJSDate(),
          mode: "dir",
        },
        PersistentDirectory.options.length,
      );
    }
    case "/shows": {
      const totalShows = await database.show.count({
        seasons: {
          episodes: {
            filesystemEntries: {
              $some: {
                type: "media",
              },
            },
          },
        },
      });

      const oldestShow = await database.mediaEntry.findOne(
        {
          type: "media",
          mediaItem: {
            type: "episode",
          },
        },
        {
          orderBy: {
            createdAt: "asc nulls last",
          },
          fields: ["createdAt"],
        },
      );

      const lastUpdatedShow = await database.mediaEntry.findOne(
        {
          type: "media",
          mediaItem: {
            type: "episode",
          },
        },
        {
          orderBy: {
            updatedAt: "desc nulls last",
          },
          fields: ["updatedAt"],
        },
      );

      return stat(
        {
          mtime:
            lastUpdatedShow?.updatedAt ??
            oldestShow?.createdAt ??
            DateTime.now().toJSDate(),
          atime:
            lastUpdatedShow?.updatedAt ??
            oldestShow?.createdAt ??
            DateTime.now().toJSDate(),
          ctime: oldestShow?.createdAt ?? DateTime.now().toJSDate(),
          mode: "dir",
        },
        totalShows,
      );
    }
    case "/movies": {
      const totalMovies = await database.movie.count({
        filesystemEntries: {
          $some: {
            type: "media",
          },
        },
      });

      const lastUpdatedMovie = await database.mediaEntry.findOne(
        {
          type: "media",
          mediaItem: {
            type: "movie",
          },
        },
        {
          orderBy: {
            updatedAt: "desc nulls last",
          },
          fields: ["updatedAt"],
        },
      );

      const oldestMovie = await database.mediaEntry.findOne(
        {
          type: "media",
          mediaItem: {
            type: "movie",
          },
        },
        {
          orderBy: {
            createdAt: "asc nulls last",
          },
          fields: ["createdAt"],
        },
      );

      return stat(
        {
          mtime:
            lastUpdatedMovie?.updatedAt ??
            oldestMovie?.createdAt ??
            DateTime.now().toJSDate(),
          atime:
            lastUpdatedMovie?.updatedAt ??
            oldestMovie?.createdAt ??
            DateTime.now().toJSDate(),
          ctime: oldestMovie?.createdAt ?? DateTime.now().toJSDate(),
          mode: "dir",
        },
        totalMovies,
      );
    }
  }

  const pathInfo = PathInfo.parse(path);
  const entry = await getEntry(pathInfo);

  if (!entry) {
    throw new FuseError(Fuse.ENOENT, "Entry not found");
  }

  const subDirectoryCount =
    pathInfo.pathType === "show-seasons"
      ? await database.season.count({
          show: {
            tvdbId: String(pathInfo.tvdbId),
          },
          episodes: {
            filesystemEntries: {
              $some: {
                type: "media",
              },
            },
          },
        })
      : 0;

  const attrs = stat(
    {
      ctime: entry.createdAt,
      atime: entry.updatedAt ?? entry.createdAt,
      mtime: entry.updatedAt ?? entry.createdAt,
      ...(pathInfo.isFile
        ? {
            size: entry.filesystemEntries[0]?.fileSize ?? 0,
            mode: "file",
          }
        : { mode: "dir" }),
    },
    subDirectoryCount,
  );

  return attrs;
}

export const getattrSync = function (path, callback) {
  const cachedAttr = attrCache.get(path);

  if (cachedAttr) {
    logger.silly(`VFS getattr: Cache hit for path ${path}`);

    process.nextTick(callback, null, cachedAttr);

    return;
  }

  if (isHiddenPath(path) || isIgnoredPath(path)) {
    logger.silly(`VFS getattr: Skipping hidden/ignored path ${path}`);

    process.nextTick(callback, Fuse.ENOENT);

    return;
  }

  getattr(path)
    .then((attrs) => {
      attrCache.set(path, attrs);

      logger.silly(`VFS getattr: Cache miss for path ${path}`);

      process.nextTick(callback, null, attrs);
    })
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS getattr FuseError: ${error.message}`);

        process.nextTick(callback, error.errorCode);

        return;
      }

      if (isZodErrorLike(error)) {
        logger.error(`VFS getattr validation error: ${error.message}`);

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      logger.error(`VFS getattr unknown error: ${String(error)}`);

      process.nextTick(callback, Fuse.EIO);
    });
} satisfies OPERATIONS["getattr"];

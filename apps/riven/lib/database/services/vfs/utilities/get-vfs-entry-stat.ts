import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
} from "@rivenmedia/plugin-sdk/dto/entities";

import Fuse from "@zkochan/fuse-native";
import { DateTime } from "luxon";

import { FuseError } from "../../../../vfs/errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { getEntry } from "./get-vfs-path-entry.ts";
import { stat } from "./stat.ts";

import type { EntityManager } from "@mikro-orm/core";

export async function getVfsEntryStat(em: EntityManager, path: string) {
  switch (path) {
    case "/": {
      const oldestMediaEntryQuery = em.findOne(
        MediaEntry,
        { type: "media" },
        {
          orderBy: {
            createdAt: "asc nulls last",
          },
          fields: ["createdAt"],
        },
      );

      const mostRecentlyUpdatedMediaEntry = em.findOne(
        MediaEntry,
        { type: "media" },
        {
          orderBy: {
            updatedAt: "desc nulls last",
          },
          fields: ["updatedAt"],
        },
      );

      const [oldestEntry, mostRecentlyUpdatedEntry] = await Promise.all([
        oldestMediaEntryQuery,
        mostRecentlyUpdatedMediaEntry,
      ]);

      const fallbackDate = DateTime.utc().toJSDate();

      const entryStat = stat(
        {
          mtime:
            mostRecentlyUpdatedEntry?.updatedAt ??
            oldestEntry?.createdAt ??
            fallbackDate,
          atime:
            mostRecentlyUpdatedEntry?.updatedAt ??
            oldestEntry?.createdAt ??
            fallbackDate,
          ctime: oldestEntry?.createdAt ?? fallbackDate,
          mode: "dir",
        },
        PersistentDirectory.options.length,
      );

      return entryStat;
    }
    case "/shows": {
      const totalShowsQuery = em.count(Show, {
        seasons: {
          episodes: {
            filesystemEntries: {
              $some: {
                type: "media",
                mediaItem: {
                  type: "episode",
                },
              },
            },
          },
        },
      });

      const oldestShowQuery = em.findOne(
        MediaEntry,
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

      const lastUpdatedShowQuery = em.findOne(
        MediaEntry,
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

      const [totalShows, oldestShow, lastUpdatedShow] = await Promise.all([
        totalShowsQuery,
        oldestShowQuery,
        lastUpdatedShowQuery,
      ]);

      const fallbackDate = DateTime.utc().toJSDate();

      const entryStat = stat(
        {
          mtime:
            lastUpdatedShow?.updatedAt ?? oldestShow?.createdAt ?? fallbackDate,
          atime:
            lastUpdatedShow?.updatedAt ?? oldestShow?.createdAt ?? fallbackDate,
          ctime: oldestShow?.createdAt ?? fallbackDate,
          mode: "dir",
        },
        totalShows,
      );

      return entryStat;
    }
    case "/movies": {
      const totalMoviesQuery = em.count(Movie, {
        filesystemEntries: {
          $some: {
            type: "media",
            mediaItem: {
              type: "movie",
            },
          },
        },
      });

      const lastUpdatedMovieQuery = em.findOne(
        MediaEntry,
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

      const oldestMovieQuery = em.findOne(
        MediaEntry,
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

      const [totalMovies, lastUpdatedMovie, oldestMovie] = await Promise.all([
        totalMoviesQuery,
        lastUpdatedMovieQuery,
        oldestMovieQuery,
      ]);

      const fallbackDate = DateTime.utc().toJSDate();

      const entryStat = stat(
        {
          mtime:
            lastUpdatedMovie?.updatedAt ??
            oldestMovie?.createdAt ??
            fallbackDate,
          atime:
            lastUpdatedMovie?.updatedAt ??
            oldestMovie?.createdAt ??
            fallbackDate,
          ctime: oldestMovie?.createdAt ?? fallbackDate,
          mode: "dir",
        },
        totalMovies,
      );

      return entryStat;
    }
  }

  const pathInfo = PathInfo.safeParse(path);

  if (!pathInfo.success) {
    throw new FuseError(Fuse.ENOENT, "Invalid path");
  }

  const entry = await getEntry(em, pathInfo.data);

  if (!entry) {
    throw new FuseError(Fuse.ENOENT, "Entry not found");
  }

  const subDirectoryCount =
    pathInfo.data.pathType === "show-seasons"
      ? await em.count(Season, {
          show: {
            tvdbId: String(pathInfo.data.tvdbId),
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

  const isFileEntry = entry instanceof Movie || entry instanceof Episode;

  const attrs = stat(
    {
      ctime: entry.createdAt,
      atime: entry.updatedAt ?? entry.createdAt,
      mtime: entry.updatedAt ?? entry.createdAt,
      ...(isFileEntry && pathInfo.data.isFile
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

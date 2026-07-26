import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities";

import Fuse from "@zkochan/fuse-native";
import { DateTime } from "luxon";

import { FuseError } from "../../../../vfs/errors/fuse-error.ts";
import { librarySectionRegistry } from "../../library-section/section-registry.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { resolveVfsPath } from "../schemas/vfs-path.schema.ts";
import { getEntry } from "./get-vfs-path-entry.ts";
import { stat } from "./stat.ts";

import type { EntityManager, FilterQuery } from "@mikro-orm/core";
import type { Promisable } from "type-fest";

async function getEntryFileSize(entry: Movie | Episode | SubtitleEntry) {
  if (entry instanceof Movie || entry instanceof Episode) {
    const [mediaEntry] = await entry.filesystemEntries.matching({
      where: {
        type: "media",
      },
    });

    return mediaEntry?.fileSize ?? 0;
  }

  return entry.fileSize;
}

/**
 * Builds the stat for a directory whose timestamps are derived from the media
 * entries it contains.
 *
 * `mtime`/`atime` track the most recently updated entry, falling back to the
 * oldest entry's creation date and finally to now. `ctime` tracks the oldest
 * entry's creation date.
 *
 * @param mediaEntryWhere Narrows the entries the timestamps are derived from.
 * @param subDirectoryCount Used for `nlink`. Accepts a promise so the caller's
 * count query runs concurrently with the timestamp queries.
 */
async function getDirectoryStat(
  em: EntityManager,
  mediaEntryWhere: FilterQuery<MediaEntry>,
  subDirectoryCount: Promisable<number>,
) {
  const [oldestEntry, mostRecentlyUpdatedEntry, totalSubDirectories] =
    await Promise.all([
      em.findOne(MediaEntry, mediaEntryWhere, {
        orderBy: {
          createdAt: "asc nulls last",
        },
        fields: ["createdAt"],
      }),
      em.findOne(MediaEntry, mediaEntryWhere, {
        orderBy: {
          updatedAt: "desc nulls last",
        },
        fields: ["updatedAt"],
      }),
      subDirectoryCount,
    ]);

  const fallbackDate = DateTime.utc().toJSDate();
  const lastModified =
    mostRecentlyUpdatedEntry?.updatedAt ??
    oldestEntry?.createdAt ??
    fallbackDate;

  return stat(
    {
      mtime: lastModified,
      atime: lastModified,
      ctime: oldestEntry?.createdAt ?? fallbackDate,
      mode: "dir",
    },
    totalSubDirectories,
  );
}

export async function getVfsEntryStat(em: EntityManager, path: string) {
  switch (path) {
    case "/": {
      const enabled = await librarySectionRegistry.enabledSections(em);

      return getDirectoryStat(
        em,
        { type: "media" },
        PersistentDirectory.options.length + enabled.length,
      );
    }
    case "/shows": {
      return getDirectoryStat(
        em,
        { type: "media", mediaItem: { type: "episode" } },
        em.count(Show, {
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
        }),
      );
    }
    case "/movies": {
      return getDirectoryStat(
        em,
        { type: "media", mediaItem: { type: "movie" } },
        em.count(Movie, {
          filesystemEntries: {
            $some: {
              type: "media",
              mediaItem: {
                type: "movie",
              },
            },
          },
        }),
      );
    }
  }

  const sections = await librarySectionRegistry.snapshot(em);
  const resolved = resolveVfsPath(path, sections);

  if (!resolved || resolved.kind === "root") {
    throw new FuseError(Fuse.ENOENT, "Unable to parse path info");
  }

  if (resolved.kind === "section-root") {
    const { section } = resolved;

    return getDirectoryStat(em, { type: "media" }, section.mediaTypes.length);
  }

  const { section, pathInfo: info } = resolved;

  // A section namespace is the built-in listing restricted to its members, so
  // it shares the built-in stat shape with a filtered count.
  if (
    section &&
    (info.pathType === "all-movies" || info.pathType === "all-shows")
  ) {
    const membership = await librarySectionRegistry.membershipFor(
      em,
      section.id,
    );
    const isMovies = info.pathType === "all-movies";

    return getDirectoryStat(
      em,
      { type: "media", mediaItem: { type: isMovies ? "movie" : "episode" } },
      isMovies
        ? (membership?.movieTmdbIds.size ?? 0)
        : (membership?.showTvdbIds.size ?? 0),
    );
  }

  // Membership is checked straight off the parsed path, using the provider
  // token already extracted from the entry name, so no query is needed.
  if (section) {
    const membership = await librarySectionRegistry.membershipFor(
      em,
      section.id,
    );

    const belongs =
      info.tmdbId === undefined
        ? info.tvdbId === undefined ||
          (membership?.showTvdbIds.has(info.tvdbId) ?? false)
        : (membership?.movieTmdbIds.has(info.tmdbId) ?? false);

    if (!belongs) {
      throw new FuseError(
        Fuse.ENOENT,
        "Item is not a member of this library section",
      );
    }
  }

  const entry = await getEntry(em, info);

  if (!entry) {
    throw new FuseError(Fuse.ENOENT, "No VFS entry found");
  }

  const subDirectoryCount =
    info.pathType === "show-seasons"
      ? await em.count(Season, {
          show: {
            tvdbId: String(info.tvdbId),
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

  const isFileEntry =
    entry instanceof Movie ||
    entry instanceof Episode ||
    entry instanceof SubtitleEntry;

  const attrs = stat(
    {
      ctime: entry.createdAt,
      atime: entry.updatedAt ?? entry.createdAt,
      mtime: entry.updatedAt ?? entry.createdAt,
      ...(isFileEntry && info.isFile
        ? {
            size: await getEntryFileSize(entry),
            mode: "file",
          }
        : { mode: "dir" }),
    },
    subDirectoryCount,
  );

  return attrs;
}

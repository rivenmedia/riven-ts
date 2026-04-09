import path from "node:path";

import { database } from "../../database/database.ts";

import type { FindOptions } from "@mikro-orm/core";
import type { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities";

const extractPart = (
  entry: FileSystemEntry,
  names: Set<string>,
  tvdbId?: string,
  season?: number,
) => {
  if (!entry.path) {
    return;
  }

  const { dir, base } = path.parse(entry.path);
  const [showName, seasonName] = dir.split(path.sep);
  const part = tvdbId ? (season ? base : seasonName) : showName;

  if (part) {
    names.add(part);
  }

  return names;
};

export const getShowsDirectoryEntries = async (
  tvdbId: string | undefined,
  season: number | undefined,
): Promise<string[]> => {
  const filter = {
    mediaItem: {
      type: "episode" as const,
      ...(tvdbId && { tvdbId }),
      ...(season && {
        season: {
          number: season,
        },
      }),
    },
  };

  // TODO: Is there a better way to do this?
  // MikroORM doesn't like `mediaItem.season.show` in the type definition
  const populateOpts = {
    populate: ["mediaItem.season.show"] as never,
  } satisfies FindOptions<FileSystemEntry>;

  const [mediaEntries, subtitleEntries] = await Promise.all([
    database.mediaEntry.find(filter, populateOpts),
    database.subtitleEntry.find(filter, populateOpts),
  ]);

  const names = new Set<string>();

  for (const entry of [...mediaEntries, ...subtitleEntries]) {
    extractPart(entry, names, tvdbId, season);
  }

  return Array.from(names);
};

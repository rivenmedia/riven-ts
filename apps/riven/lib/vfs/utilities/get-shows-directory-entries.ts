import path from "node:path";

import { database } from "../../database/database.ts";

import type { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities";

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
  };

  const [mediaEntries, subtitleEntries] = await Promise.all([
    database.mediaEntry.find(filter, populateOpts),
    database.subtitleEntry.find(filter, populateOpts),
  ]);

  const names = new Set<string>();

  const extractPart = (entry: FileSystemEntry) => {
    if (!entry.path) return;

    const { dir, base } = path.parse(entry.path);
    const [showName, seasonName] = dir.split(path.sep);
    const part = tvdbId ? (season ? base : seasonName) : showName;

    if (part) {
      names.add(part);
    }
  };

  for (const entry of mediaEntries) {
    extractPart(entry);
  }

  for (const entry of subtitleEntries) {
    extractPart(entry);
  }

  return Array.from(names);
};

import { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities";

import path from "node:path";

import type { PathInfo } from "../schemas/path-info.schema.ts";
import type { EntityManager } from "@mikro-orm/core";

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
  em: EntityManager,
  { tvdbId, season }: PathInfo,
): Promise<string[]> => {
  const entries = await em.find(FileSystemEntry, {
    type: {
      $in: ["media", "subtitle"],
    },
    mediaItem: {
      type: "episode",
      ...(tvdbId && { tvdbId }),
      ...(season && {
        season: {
          number: season,
        },
      }),
    },
  });

  const names = new Set<string>();

  for (const entry of entries) {
    extractPart(entry, names, tvdbId, season);
  }

  return Array.from(names);
};

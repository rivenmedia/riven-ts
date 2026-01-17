import { database } from "@repo/core-util-database/connection";
import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import { childQueryType } from "../config.ts";

import type { PersistentDirectory } from "../schemas/persistent-directory.ts";

export const getItemDirectoryEntries = async (
  directoryType: PersistentDirectory,
  tmdbId: string,
): Promise<string[]> => {
  const entries = await database.manager.find(MediaEntry, {
    select: {
      originalFilename: true,
      mediaItem: {
        tmdbId: true,
        year: true,
        title: true,
      },
    },
    where: {
      mediaItem: {
        type: childQueryType[directoryType],
        tmdbId,
      },
    },
    relations: {
      mediaItem: true,
    },
  });

  return entries.map((entry) => entry.path);
};

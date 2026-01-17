import { database } from "@repo/core-util-database/connection";
import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import { childQueryType } from "../config.ts";

import type { PersistentDirectory } from "../schemas/persistent-directory.ts";

export const getPersistentDirectoryEntries = async (
  directoryType: PersistentDirectory,
): Promise<string[]> => {
  const entries = await database.manager.find(MediaEntry, {
    select: {
      mediaItem: {
        tmdbId: true,
        year: true,
        title: true,
      },
    },
    where: {
      mediaItem: {
        type: childQueryType[directoryType],
      },
    },
    relations: {
      mediaItem: true,
    },
  });

  return entries.reduce<string[]>((acc, entry) => {
    if (!entry.mediaItem.title) {
      return acc;
    }

    return [...acc, entry.mediaItem.path];
  }, []);
};

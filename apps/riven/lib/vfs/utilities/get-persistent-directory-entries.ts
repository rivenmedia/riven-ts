import { database } from "@repo/core-util-database/database";

import { childQueryType } from "../config.ts";

import type { PersistentDirectory } from "../schemas/persistent-directory.ts";

export const getPersistentDirectoryEntries = async (
  directoryType: PersistentDirectory,
): Promise<string[]> => {
  const entries = await database.mediaEntry.find(
    {
      mediaItem: {
        type: childQueryType[directoryType],
      },
    },
    {
      populate: ["$infer"],
      fields: ["mediaItem"],
    },
  );

  return entries.reduce<string[]>((acc, entry) => {
    if (!entry.mediaItem.$.path) {
      return acc;
    }

    return [...acc, entry.mediaItem.$.path];
  }, []);
};

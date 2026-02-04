import { database } from "../../database/database.ts";
import { config } from "../config.ts";

import type { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";

export const getPersistentDirectoryEntries = async (
  directoryType: PersistentDirectory,
): Promise<string[]> => {
  const entries = await database.mediaEntry.find(
    {
      mediaItem: {
        type: config.childQueryType[directoryType],
      },
    },
    {
      populate: ["$infer"],
      fields: ["mediaItem"],
    },
  );

  return entries.reduce<string[]>((acc, entry) => {
    if (!entry.mediaItem.$.prettyName) {
      return acc;
    }

    return [...acc, entry.mediaItem.$.prettyName];
  }, []);
};

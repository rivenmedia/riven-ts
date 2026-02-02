import { database } from "@repo/core-util-database/database";

import { config } from "../config.ts";

import type { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";

export const getItemDirectoryEntries = async (
  directoryType: PersistentDirectory,
  tmdbId: string,
): Promise<string[]> => {
  const entries = await database.mediaEntry.find(
    {
      mediaItem: {
        type: config.childQueryType[directoryType],
        tmdbId,
      },
    },
    {
      populate: ["mediaItem"],
      fields: ["originalFilename", "mediaItem", "vfsFileName"],
    },
  );

  return entries.map((entry) => entry.vfsFileName);
};

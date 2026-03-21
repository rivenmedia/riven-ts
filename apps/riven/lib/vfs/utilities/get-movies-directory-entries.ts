import { reduceAsync } from "es-toolkit";

import { database } from "../../database/database.ts";

export const getMoviesDirectoryEntries = async (
  tmdbId: string | undefined,
): Promise<string[]> => {
  const entries = await database.mediaEntry.find(
    {
      mediaItem: {
        type: "movie",
        ...(tmdbId && { tmdbId }),
      },
    },
    { populate: ["$infer"] },
  );

  return Array.from(
    await reduceAsync(
      entries,
      async (acc, entry) => {
        if (tmdbId) {
          return acc.add(await entry.getVfsFileName());
        }

        const prettyName = await entry.mediaItem.getEntity().getPrettyName();

        if (!prettyName) {
          return acc;
        }

        return acc.add(prettyName);
      },
      new Set<string>(),
    ),
  );
};

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
    entries.reduce<Set<string>>((acc, entry) => {
      if (tmdbId) {
        return new Set([...acc, entry.vfsFileName]);
      }

      const { prettyName } = entry.mediaItem.getEntity();

      if (!prettyName) {
        return acc;
      }

      return new Set([...acc, prettyName]);
    }, new Set<string>()),
  );
};

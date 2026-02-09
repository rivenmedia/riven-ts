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

  return entries.reduce<string[]>((acc, entry) => {
    if (tmdbId) {
      return [...acc, entry.vfsFileName];
    }

    const { prettyName } = entry.mediaItem.getEntity();

    if (!prettyName) {
      return acc;
    }

    return [...acc, prettyName];
  }, []);
};

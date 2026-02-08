import { database } from "../../database/database.ts";

export const getMoviesDirectoryEntries = async (): Promise<string[]> => {
  const entries = await database.mediaEntry.find(
    {
      mediaItem: {
        type: "movie",
      },
    },
    { populate: ["mediaItem"] },
  );

  return entries.reduce<string[]>((acc, entry) => {
    const prettyName = entry.mediaItem.getProperty("prettyName");

    if (!prettyName) {
      return acc;
    }

    return [...acc, prettyName];
  }, []);
};

import { database } from "../../database/database.ts";

export const getMoviesDirectoryEntries = async (
  tmdbId: string | undefined,
): Promise<string[]> => {
  const filter = {
    mediaItem: {
      type: "movie" as const,
      ...(tmdbId && { tmdbId }),
    },
  };

  const [mediaEntries, subtitleEntries] = await Promise.all([
    database.mediaEntry.find(filter, { populate: ["$infer"] }),
    database.subtitleEntry.find(filter, { populate: ["$infer"] }),
  ]);

  console.log(mediaEntries);
  console.log(subtitleEntries);

  const names = new Set<string>();

  for (const entry of mediaEntries) {
    if (tmdbId) {
      names.add(entry.vfsFileName);
    } else {
      const { prettyName } = entry.mediaItem.getEntity();
      if (prettyName) {
        names.add(prettyName);
      }
    }
  }

  for (const entry of subtitleEntries) {
    if (tmdbId) {
      names.add(entry.vfsFileName);
    }
    // When listing all movies (no tmdbId), directory names come from mediaEntries only
  }

  return Array.from(names);
};

import path from "node:path";

import { database } from "../../database/database.ts";

export const getShowsDirectoryEntries = async (
  tvdbId: string | undefined,
  season: number | undefined,
): Promise<string[]> => {
  const entries = await database.mediaEntry.find(
    {
      mediaItem: {
        type: "episode",
        ...(tvdbId && {
          season: {
            ...(season && { number: season }),
            parent: {
              tvdbId,
            },
          },
        }),
      },
    },
    { populate: ["*"] },
  );

  return entries.reduce<string[]>((acc, entry) => {
    if (!entry.path) {
      return acc;
    }

    const { dir, base } = path.parse(entry.path);
    const [, showName, seasonName] = dir.split(path.sep);
    const part = tvdbId ? (season ? base : seasonName) : showName;

    if (!part) {
      return acc;
    }

    return [...acc, part];
  }, []);
};

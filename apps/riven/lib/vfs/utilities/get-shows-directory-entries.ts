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
        ...(tvdbId && { tvdbId }),
        ...(season && {
          season: {
            number: season,
          },
        }),
      },
    },
    {
      // @ts-expect-error - MikroORM doesn't like `mediaItem.season.parent` in the type definition, but it does work
      populate: ["mediaItem.season.parent"],
    },
  );

  return Array.from(
    entries.reduce<Set<string>>((acc, entry) => {
      if (!entry.path) {
        return acc;
      }

      const { dir, base } = path.parse(entry.path);
      const [, showName, seasonName] = dir.split(path.sep);
      const part = tvdbId ? (season ? base : seasonName) : showName;

      if (!part) {
        return acc;
      }

      return new Set([...acc, part]);
    }, new Set<string>()),
  );
};

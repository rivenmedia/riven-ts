import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import path from "node:path";

import type { EntityManager } from "@mikro-orm/core";

export const getShowsDirectoryEntries = async (
  em: EntityManager,
  tvdbId: string | undefined,
  season: number | undefined,
): Promise<string[]> => {
  const entries = await em.find(
    MediaEntry,
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
      // TODO: Is there a better way to do this?
      // @ts-expect-error - MikroORM doesn't like `mediaItem.season.show` in the type definition
      populate: ["mediaItem.season.show"],
    },
  );

  return Array.from(
    entries.reduce<Set<string>>((acc, entry) => {
      if (!entry.path) {
        return acc;
      }

      const { dir, base } = path.parse(entry.path);
      const [showName, seasonName] = dir.split(path.sep);
      const part = tvdbId ? (season ? base : seasonName) : showName;

      if (!part) {
        return acc;
      }

      return acc.add(part);
    }, new Set<string>()),
  );
};

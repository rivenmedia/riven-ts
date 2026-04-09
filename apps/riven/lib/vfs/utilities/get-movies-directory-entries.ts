import { reduceAsync } from "es-toolkit";

import { database } from "../../database/database.ts";

import type { FilterQuery } from "@mikro-orm/core";
import type { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities";

export const getMoviesDirectoryEntries = async (
  tmdbId: string | undefined,
): Promise<string[]> => {
  const filter = {
    mediaItem: {
      type: "movie" as const,
      ...(tmdbId && { tmdbId }),
    },
  } satisfies FilterQuery<FileSystemEntry>;

  const [mediaEntries, subtitleEntries] = await Promise.all([
    database.mediaEntry.find(filter, { populate: ["$infer"] }),
    database.subtitleEntry.find(filter, { populate: ["$infer"] }),
  ]);

  return Array.from(
    await reduceAsync(
      [...mediaEntries, ...subtitleEntries],
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

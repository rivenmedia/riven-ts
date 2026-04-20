import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { reduceAsync } from "es-toolkit";

import type { PathInfo } from "../schemas/path-info.schema.ts";
import type { EntityManager } from "@mikro-orm/core";

export const getMoviesDirectoryEntries = async (
  em: EntityManager,
  { tmdbId, pathType }: PathInfo,
): Promise<string[]> => {
  const entries = await em.find(
    MediaEntry,
    {
      mediaItem: {
        type: "movie",
        ...(tmdbId && { tmdbId }),
      },
    },
    {
      populate: ["mediaItem"],
      fields: [
        "originalFilename",
        "mediaItem.title",
        "mediaItem.year",
        "mediaItem.tmdbId",
      ],
    },
  );

  return Array.from(
    await reduceAsync(
      entries,
      async (acc, entry) => {
        if (pathType === "single-movie") {
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

import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { reduceAsync } from "es-toolkit";
import path from "node:path";

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
        const vfsFileName = await entry.getVfsFileName();

        return acc.add(
          pathType === "single-movie"
            ? vfsFileName
            : path.parse(vfsFileName).name,
        );
      },
      new Set<string>(),
    ),
  );
};

import { MediaEntry } from "@rivenmedia/plugin-sdk/dto/entities";

import { PathInfo } from "../schemas/path-info.schema.ts";

import type { EntityManager } from "@mikro-orm/core";

export async function getVfsEntry(em: EntityManager, path: string) {
  const pathInfo = PathInfo.parse(path);

  if (pathInfo.tmdbId) {
    return em.findOne(MediaEntry, {
      mediaItem: {
        type: "movie",
        tmdbId: pathInfo.tmdbId,
      },
    });
  }

  if (pathInfo.tvdbId && pathInfo.season && pathInfo.episode) {
    return em.findOne(MediaEntry, {
      mediaItem: {
        type: "episode",
        tvdbId: pathInfo.tvdbId,
        number: pathInfo.episode,
        season: {
          number: pathInfo.season,
        },
      },
    });
  }

  return null;
}

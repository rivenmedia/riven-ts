import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { PathInfo } from "../schemas/path-info.schema.ts";

import type { EntityManager } from "@mikro-orm/core";

export async function getVfsMediaEntry(em: EntityManager, pathInfo: PathInfo) {
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

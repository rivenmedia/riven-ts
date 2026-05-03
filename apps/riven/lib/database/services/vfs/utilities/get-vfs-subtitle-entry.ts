import { SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import { PathInfo } from "../schemas/path-info.schema.ts";

import type { EntityManager } from "@mikro-orm/core";

export async function getVfsSubtitleEntry(em: EntityManager, path: string) {
  const pathInfo = PathInfo.parse(path);

  if (pathInfo.tmdbId) {
    return em.findOne(SubtitleEntry, {
      mediaItem: { tmdbId: pathInfo.tmdbId },
      path: { $like: `%${pathInfo.base}` },
    });
  }

  if (pathInfo.tvdbId && pathInfo.season && pathInfo.episode) {
    return em.findOne(SubtitleEntry, {
      mediaItem: {
        type: "episode",
        number: pathInfo.episode,
        season: { number: pathInfo.season },
        tvdbId: pathInfo.tvdbId,
      },
      path: { $like: `%${pathInfo.base}` },
    });
  }

  return null;
}

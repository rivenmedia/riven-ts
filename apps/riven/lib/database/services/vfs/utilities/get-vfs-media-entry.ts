import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { PathInfo } from "../schemas/path-info.schema.ts";

import type { EntityManager, FindOneOptions } from "@mikro-orm/core";

export async function getVfsMediaEntry<
  Hint extends string = never,
  Fields extends string = never,
  Excludes extends string = never,
>(
  em: EntityManager,
  pathInfo: PathInfo,
  options?: FindOneOptions<MediaEntry, Hint, Fields, Excludes>,
) {
  if (pathInfo.tmdbId) {
    return em.findOne(
      MediaEntry,
      {
        mediaItem: {
          type: "movie",
          tmdbId: pathInfo.tmdbId,
        },
      },
      options,
    );
  }

  if (pathInfo.tvdbId && pathInfo.season && pathInfo.episode) {
    return em.findOne(
      MediaEntry,
      {
        mediaItem: {
          type: "episode",
          tvdbId: pathInfo.tvdbId,
          number: pathInfo.episode,
          season: {
            number: pathInfo.season,
          },
        },
      },
      options,
    );
  }

  return null;
}

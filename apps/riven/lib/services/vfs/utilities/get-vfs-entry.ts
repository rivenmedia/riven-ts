import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { database } from "../../../database/database.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";

export async function getVfsEntry(path: string) {
  const em = database.em.getContext();

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

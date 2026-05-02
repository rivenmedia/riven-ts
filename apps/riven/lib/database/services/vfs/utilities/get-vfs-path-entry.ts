import {
  Episode,
  Movie,
  Season,
  Show,
} from "@rivenmedia/plugin-sdk/dto/entities";

import type { PathInfo } from "../schemas/path-info.schema.ts";
import type { EntityManager } from "@mikro-orm/core";

export function getEntry(em: EntityManager, pathInfo: PathInfo) {
  switch (pathInfo.pathType) {
    case "single-movie": {
      if (!pathInfo.tmdbId) {
        throw new TypeError("Missing tmdbId for movie path");
      }

      return em.findOneOrFail(
        Movie,
        { tmdbId: pathInfo.tmdbId },
        { fields: ["createdAt", "updatedAt", "filesystemEntries.fileSize"] },
      );
    }
    case "single-episode": {
      if (!pathInfo.tvdbId || !pathInfo.season || !pathInfo.episode) {
        throw new TypeError(
          "Missing tvdbId, season, or episode for episode path",
        );
      }

      return em.findOneOrFail(
        Episode,
        {
          season: {
            number: pathInfo.season,
            show: {
              tvdbId: pathInfo.tvdbId,
            },
          },
          number: pathInfo.episode,
        },
        { fields: ["createdAt", "updatedAt", "filesystemEntries.fileSize"] },
      );
    }
    case "show-seasons": {
      if (!pathInfo.tvdbId) {
        throw new TypeError("Missing tvdbId for show seasons path");
      }

      return em.findOneOrFail(
        Show,
        { tvdbId: pathInfo.tvdbId },
        { fields: ["createdAt", "updatedAt"] },
      );
    }
    case "season-episodes": {
      if (!pathInfo.tvdbId || !pathInfo.season) {
        throw new TypeError(
          "Missing tvdbId or season for season episodes path",
        );
      }

      return em.findOneOrFail(
        Season,
        {
          show: {
            tvdbId: pathInfo.tvdbId,
          },
          number: pathInfo.season,
        },
        { fields: ["createdAt", "updatedAt"] },
      );
    }
    default:
      return null;
  }
}

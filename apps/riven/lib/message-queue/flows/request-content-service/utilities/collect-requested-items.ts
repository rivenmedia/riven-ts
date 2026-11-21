import { logger } from "#utilities/logger/logger.ts";

import type { RequestedItem } from "#message-queue/flows/request-content-service/request-content-service.processor.ts";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

function buildExternalIdKey(
  /**
   * The media type, which keeps movies and shows apart as their TMDB and TVDB IDs can collide.
   */
  type: "movie" | "show",
  /**
   * The primary external ID for the movie or show. This could be the TMDB ID for movies or the TVDB ID for shows.
   */
  primaryExternalKey: string | null | undefined,
  /**
   * The IMDB ID for the movie or show. This is used as a fallback if the primary external ID is not available.
   */
  imdbKey: string | null | undefined,
) {
  const externalKey = primaryExternalKey ?? imdbKey;

  return externalKey ? `${type}:${externalKey}` : null;
}

/**
 * Collects the items returned by the content service into a map of unique items, keyed by media type and external ID.
 *
 * Movies and shows are keyed separately, as TMDB and TVDB IDs can collide.
 */
export function collectRequestedItems(
  childrenData: ContentServiceRequestedResponse[],
) {
  let updateIntervalSeconds: number | null = null;

  const items = new Map<string, RequestedItem>();

  for (const childData of childrenData) {
    updateIntervalSeconds ??= childData.updateIntervalSeconds;

    for (const movie of childData.movies) {
      const key = buildExternalIdKey("movie", movie.tmdbId, movie.imdbId);

      if (!key) {
        logger.warn(
          `Skipping requested movie with no valid external ID: ${JSON.stringify(movie)}`,
        );

        continue;
      }

      items.set(key, { item: movie, type: "movie" });
    }

    for (const show of childData.shows) {
      const key = buildExternalIdKey("show", show.tvdbId, show.imdbId);

      if (!key) {
        logger.warn(
          `Skipping requested show with no valid external ID: ${JSON.stringify(show)}`,
        );

        continue;
      }

      items.set(key, { item: show, type: "show" });
    }
  }

  return { items, updateIntervalSeconds };
}

import { gql } from "$lib/graphql-client";
import { createScopedLogger } from "$lib/logger";
import {
  fetchTmdbTrending,
  mapGqlTmdbList,
} from "$lib/services/backend-metadata";
import {
  RECENT_ITEMS_QUERY,
  type RecentItemsResponse,
  type RecentListItem,
  getRecentItemsVariables,
  mapRecentItemsPage,
} from "$lib/services/recent-items";
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

const logger = createScopedLogger("home");

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user || !locals.session) redirect(302, "/auth/login");

  try {
    const trendingResults = await fetchTmdbTrending(
      { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
      { type: "all", timeWindow: "day", page: 1 },
    );

    let recentlyAdded: RecentListItem[] = [];
    try {
      const recentData = await gql<RecentItemsResponse>(
        locals.backendUrl,
        locals.apiKey,
        RECENT_ITEMS_QUERY,
        getRecentItemsVariables(),
        fetch,
      );
      recentlyAdded = mapRecentItemsPage(recentData).items;
    } catch (err) {
      logger.error("Error fetching recently added data:", err);
    }

    // Filter to only movies and TV shows with backdrops
    const tmdbResults = mapGqlTmdbList(trendingResults);
    const filtered = tmdbResults.filter(
      (item) =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.backdrop_path,
    );

    return { nowPlaying: filtered, recentlyAdded };
  } catch (err) {
    logger.error("Error fetching now playing data:", err);
    return { nowPlaying: [], recentlyAdded: [] };
  }
};

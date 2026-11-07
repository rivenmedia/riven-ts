import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import { movieListItemToTmdbMovie } from "../utilities/to-tmdb-movie.ts";
import { showListItemsToTmdbShows } from "../utilities/to-tmdb-show.ts";

import type { RivenQueryHandler } from "@repo/util-plugin-sdk/schemas/query-handlers/index";

export const searchTmdb: RivenQueryHandler<"search"> = {
  type: TmdbIndexerData,
  mediaTypes: ["movie", "show"],
  async handler({ args, dataSources }) {
    const api = dataSources.get(TmdbAPI);
    const { results } = await api.searchMulti(args.query, args.page);

    const shows = await showListItemsToTmdbShows(
      api,
      results.filter((result) => result.media_type === "tv"),
    );
    const showsByTmdbId = new Map(shows.map((show) => [show.tmdbId, show]));

    // Rebuild the list in TMDB's order, as it is sorted by relevance
    return results.flatMap((result) => {
      if (result.media_type === "movie") {
        return movieListItemToTmdbMovie(result) ?? [];
      }

      if (result.media_type === "tv") {
        return showsByTmdbId.get(result.id.toString()) ?? [];
      }

      return [];
    });
  },
};

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import {
  mapMovieListItem,
  mapShowListItem,
} from "../utilities/map-search-items.ts";

import type { RivenQueryHandler } from "@repo/util-plugin-sdk/schemas/query-handlers/index";

export const searchTmdbMovies: RivenQueryHandler<"search"> = {
  type: TmdbIndexerData,
  mediaTypes: ["movie", "show"],
  async handler({ args, dataSources }) {
    const { results = [] } = await dataSources
      .get(TmdbAPI)
      .searchMulti(args.query, args.page);

    const parsedResults = [];

    for (const result of results) {
      if (!result.media_type) {
        continue;
      }

      switch (result.media_type) {
        case "movie": {
          const item = mapMovieListItem(result);

          if (item) {
            parsedResults.push(item);
          }

          break;
        }
        case "tv": {
          const item = mapShowListItem(result);

          if (item) {
            parsedResults.push(item);
          }

          break;
        }
      }
    }

    return parsedResults;
  },
};

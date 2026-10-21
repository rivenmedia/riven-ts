import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import { mapMovieListItem, mapShowListItem } from "../utilities/map-movie.ts";

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
          parsedResults.push(mapMovieListItem(result));

          break;
        }
        case "tv": {
          parsedResults.push(mapShowListItem(result));

          break;
        }
      }
    }

    return parsedResults.filter((movie) => movie !== null);
  },
};

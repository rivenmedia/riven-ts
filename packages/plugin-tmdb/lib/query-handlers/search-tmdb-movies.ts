import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import { mapMovieListItem } from "../utilities/map-movie.ts";

import type { RivenQueryHandler } from "@repo/util-plugin-sdk/schemas/query-handlers/index";

export const searchTmdbMovies: RivenQueryHandler<"search"> = {
  type: TmdbIndexerData,
  mediaTypes: ["movie"],
  async handler({ args, dataSources }) {
    const { results = [] } = await dataSources
      .get(TmdbAPI)
      .searchMovies(args.query);

    return results.map(mapMovieListItem).filter((movie) => movie !== null);
  },
};

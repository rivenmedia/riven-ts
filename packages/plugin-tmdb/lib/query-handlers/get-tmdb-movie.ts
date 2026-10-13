import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import { mapMovieDetails } from "../utilities/map-movie.ts";

import type { RivenQueryHandler } from "@repo/util-plugin-sdk/schemas/query-handlers/index";

export const getTmdbMovie: RivenQueryHandler<"indexerItem"> = {
  type: TmdbIndexerData,
  mediaTypes: ["movie"],
  async handler({ args, dataSources }) {
    const item = await dataSources.get(TmdbAPI).getMovieDetails(args.id);

    return mapMovieDetails(args.id, item);
  },
};

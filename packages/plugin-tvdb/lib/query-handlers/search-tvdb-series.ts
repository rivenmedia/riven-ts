import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { TvdbIndexerData } from "../schema/types/tvdb-indexer-data.type.ts";
import { transformSearchResult } from "../transformers/transform-indexer-data.ts";

import type { RivenQueryHandler } from "@repo/util-plugin-sdk/schemas/query-handlers/index";

export const searchTvdbSeries: RivenQueryHandler<"search"> = {
  type: TvdbIndexerData,
  mediaTypes: ["show"],
  async handler({ args, dataSources }) {
    const results = await dataSources.get(TvdbAPI).searchSeries(args.query);

    return results
      .map(transformSearchResult)
      .filter((series) => series !== null);
  },
};

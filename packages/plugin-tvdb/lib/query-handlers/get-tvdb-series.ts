import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { TvdbIndexerData } from "../schema/types/tvdb-indexer-data.type.ts";
import { transformSeriesToIndexerData } from "../transformers/transform-indexer-data.ts";

import type { RivenQueryHandler } from "@repo/util-plugin-sdk/schemas/query-handlers/index";

export const getTvdbSeries: RivenQueryHandler<"indexerItem"> = {
  type: TvdbIndexerData,
  mediaTypes: ["show"],
  async handler({ args, dataSources }) {
    const series = await dataSources.get(TvdbAPI).getSeries(args.id);

    return transformSeriesToIndexerData(series);
  },
};

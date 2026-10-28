import { PluginDataSource } from "@repo/util-plugin-sdk";
import { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

import {
  FieldResolver,
  Resolver,
  Root,
  getMetadataStorage,
} from "type-graphql";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { pluginConfig } from "../tvdb-plugin.config.ts";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

@Resolver(() => {
  const tmdbIndexerData = getMetadataStorage().objectTypes.find(
    (type) => type.name === "TmdbIndexerData",
  );

  if (!tmdbIndexerData) {
    throw new Error("TmdbIndexerData type not found in metadata storage");
  }

  return tmdbIndexerData.target;
})
export class TvdbTmdbIndexerDataResolver {
  @FieldResolver(() => [IndexerSeason], { nullable: true })
  public async seasons(
    @Root() tmdbIndexerData: IndexerData,
    @PluginDataSource(pluginConfig.name, TvdbAPI) api: TvdbAPI,
  ): Promise<IndexerSeason[] | null> {
    if (tmdbIndexerData.type !== "show") {
      return null;
    }

    return api.getAllSeasonsInOfficialOrder(tmdbIndexerData.id);
  }
}

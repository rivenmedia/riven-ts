import { PluginDataSource } from "@repo/util-plugin-sdk";
import { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

import {
  Arg,
  FieldResolver,
  Int,
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

  @FieldResolver(() => IndexerSeason, {
    nullable: true,
    description:
      "A single season of the show in official order, including its episodes. Specials are season 0.",
  })
  public async season(
    @Root() tmdbIndexerData: IndexerData,
    @Arg("number", () => Int) number: number,
    @PluginDataSource(pluginConfig.name, TvdbAPI) api: TvdbAPI,
  ): Promise<IndexerSeason | null> {
    if (tmdbIndexerData.type !== "show") {
      return null;
    }

    return api.getSeasonInOfficialOrder(tmdbIndexerData.id, number);
  }
}

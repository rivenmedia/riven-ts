import { PluginDataSource } from "@repo/util-plugin-sdk";
import { IndexerEpisode } from "@repo/util-plugin-sdk/dto/types/indexer-episode.type";
import { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

import { Arg, FieldResolver, Int, Resolver, Root } from "type-graphql";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { pluginConfig } from "../tvdb-plugin.config.ts";

@Resolver(() => IndexerSeason)
export class TvdbIndexerSeasonResolver {
  @FieldResolver(() => IndexerEpisode, {
    nullable: true,
    description: "A single episode of the season.",
  })
  public async episode(
    @Root() season: IndexerSeason,
    @Arg("number", () => Int) number: number,
    @PluginDataSource(pluginConfig.name, TvdbAPI) api: TvdbAPI,
  ): Promise<IndexerEpisode | null> {
    // Seasons from the show's season list don't include their episodes
    const { episodes } =
      season.episodes.length > 0
        ? season
        : ((await api.getSeasonInOfficialOrder(season.rootId, season.number)) ??
          season);

    return episodes.find((episode) => episode.number === number) ?? null;
  }
}

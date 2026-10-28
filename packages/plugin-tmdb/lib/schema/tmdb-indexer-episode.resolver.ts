import { PluginDataSource } from "@repo/util-plugin-sdk";
import { CastMember } from "@repo/util-plugin-sdk/dto/types/cast-member.type";
import { IndexerEpisode } from "@repo/util-plugin-sdk/dto/types/indexer-episode.type";

import { Arg, FieldResolver, Resolver, Root } from "type-graphql";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../tmdb-plugin.config.ts";
import { getEpisodeCast } from "../utilities/get-indexer-cast.ts";

@Resolver(() => IndexerEpisode)
export class TmdbIndexerEpisodeResolver {
  @FieldResolver(() => [CastMember], {
    nullable: true,
    description: "The main cast of the episode, followed by its guest stars.",
  })
  public cast(
    @Root() episode: IndexerEpisode,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
    @Arg("language", () => String, { defaultValue: "en-US" }) language: string,
  ): Promise<CastMember[] | null> {
    return getEpisodeCast(api, episode, language);
  }
}

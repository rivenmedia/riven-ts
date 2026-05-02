import { PluginDataSource } from "@rivenmedia/plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../tmdb-plugin.config.ts";

@Resolver()
export class TmdbResolver {
  @Query(() => Boolean)
  tmdbIsValid(@PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI) {
    return api.validate();
  }
}

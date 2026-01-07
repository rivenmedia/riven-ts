import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { pluginConfig } from "../tmdb-plugin.config.ts";

import type { TmdbContextSlice } from "../datasource/tmdb.datasource.ts";

@Resolver()
export class TmdbResolver {
  @Query((_returns) => Boolean)
  async tmdbIsValid(
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}

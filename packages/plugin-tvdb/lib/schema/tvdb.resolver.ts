import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { pluginConfig } from "../tvdb-plugin.config.ts";

@Resolver()
export class TvdbResolver {
  @Query((_returns) => Boolean)
  async tvdbIsValid(
    @PluginDataSource(pluginConfig.name, TvdbAPI) api: TvdbAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}

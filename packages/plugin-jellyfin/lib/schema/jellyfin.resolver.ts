import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { JellyfinAPI } from "../datasource/jellyfin.datasource.ts";
import { pluginConfig } from "../jellyfin-plugin.config.ts";

@Resolver()
export class JellyfinResolver {
  @Query(() => Boolean)
  jellyfinIsValid(
    @PluginDataSource(pluginConfig.name, JellyfinAPI) api: JellyfinAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

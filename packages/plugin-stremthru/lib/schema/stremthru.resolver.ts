import { PluginDataSource } from "@rivenmedia/plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { StremThruTorznabAPI } from "../datasource/stremthru-torznab.datasource.ts";
import { pluginConfig } from "../stremthru-plugin.config.ts";

@Resolver()
export class StremThruResolver {
  @Query(() => Boolean)
  stremthruIsValid(
    @PluginDataSource(pluginConfig.name, StremThruTorznabAPI)
    api: StremThruTorznabAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

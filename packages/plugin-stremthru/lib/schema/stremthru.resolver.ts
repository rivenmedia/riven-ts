import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { StremThruTorzAPI } from "../datasource/stremthru-torz.datasource.ts";
import { pluginConfig } from "../stremthru-plugin.config.ts";

@Resolver()
export class StremThruResolver {
  @Query(() => Boolean)
  stremthruIsValid(
    @PluginDataSource(pluginConfig.name, StremThruTorzAPI)
    api: StremThruTorzAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

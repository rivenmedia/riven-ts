import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { StremThruAPI } from "../datasource/stremthru.datasource.ts";
import { pluginConfig } from "../stremthru-plugin.config.ts";

@Resolver()
export class StremThruResolver {
  @Query(() => Boolean)
  async stremthruIsValid(
    @PluginDataSource(pluginConfig.name, StremThruAPI) api: StremThruAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}

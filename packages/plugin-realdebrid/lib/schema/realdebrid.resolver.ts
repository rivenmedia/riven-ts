import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { RealDebridAPI } from "../datasource/realdebrid.datasource.js";
import { pluginConfig } from "../realdebrid-plugin.config.ts";

@Resolver()
export class RealDebridResolver {
  @Query((_returns) => Boolean)
  async realdebridIsValid(
    @PluginDataSource(pluginConfig.name, RealDebridAPI) api: RealDebridAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}

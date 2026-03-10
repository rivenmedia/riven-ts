import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { SubdlAPI } from "../datasource/subdl.datasource.ts";
import { pluginConfig } from "../subdl-plugin.config.ts";

@Resolver()
export class SubdlResolver {
  @Query((_returns) => Boolean)
  async subdlIsValid(
    @PluginDataSource(pluginConfig.name, SubdlAPI) api: SubdlAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}

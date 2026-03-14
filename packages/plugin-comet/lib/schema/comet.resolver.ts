import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { pluginConfig } from "../comet-plugin.config.ts";
import { CometAPI } from "../datasource/comet.datasource.ts";

@Resolver()
export class CometResolver {
  @Query((_returns) => Boolean)
  async cometIsValid(
    @PluginDataSource(pluginConfig.name, CometAPI) api: CometAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}

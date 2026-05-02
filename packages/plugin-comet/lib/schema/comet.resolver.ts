import { PluginDataSource } from "@rivenmedia/plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { pluginConfig } from "../comet-plugin.config.ts";
import { CometAPI } from "../datasource/comet.datasource.ts";

@Resolver()
export class CometResolver {
  @Query(() => Boolean)
  cometIsValid(
    @PluginDataSource(pluginConfig.name, CometAPI) api: CometAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

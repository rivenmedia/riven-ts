import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { MeteorAPI } from "../datasource/meteor.datasource.ts";
import { pluginConfig } from "../meteor-plugin.config.ts";

@Resolver()
export class MeteorResolver {
  @Query(() => Boolean)
  meteorIsValid(
    @PluginDataSource(pluginConfig.name, MeteorAPI) api: MeteorAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

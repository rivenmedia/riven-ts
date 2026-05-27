import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { NewznabAPI } from "../datasource/newznab.datasource.ts";
import { pluginConfig } from "../newznab-plugin.config.ts";

@Resolver()
export class NewznabResolver {
  @Query(() => Boolean)
  newznabIsValid(
    @PluginDataSource(pluginConfig.name, NewznabAPI) api: NewznabAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

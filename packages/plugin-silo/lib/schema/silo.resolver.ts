import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { SiloAPI } from "../datasource/silo.datasource.ts";
import { pluginConfig } from "../silo-plugin.config.ts";

@Resolver()
export class SiloResolver {
  @Query(() => Boolean)
  public async siloIsValid(
    @PluginDataSource(pluginConfig.name, SiloAPI) api: SiloAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

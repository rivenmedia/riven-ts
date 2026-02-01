import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Args, Query, Resolver } from "type-graphql";

import { MdblistAPI } from "../datasource/mdblist.datasource.ts";
import { pluginConfig } from "../mdblist-plugin.config.ts";
import { ListNamesArguments } from "./arguments/list-names.arguments.ts";
import { MdbListExternalIds } from "./types/external-ids.type.ts";

@Resolver()
export class MdblistResolver {
  @Query((_returns) => Boolean)
  async mdblistIsValid(
    @PluginDataSource(pluginConfig.name, MdblistAPI) api: MdblistAPI,
  ): Promise<boolean> {
    return await api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [MdbListExternalIds])
  async mdbListItems(
    @Args() { listNames }: ListNamesArguments,
    @PluginDataSource(pluginConfig.name, MdblistAPI) api: MdblistAPI,
  ): Promise<{ movies: MdbListExternalIds[]; shows: MdbListExternalIds[] }> {
    return await api.getListItems(new Set<string>(listNames));
  }
}

import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { PluginDataSource } from "@repo/util-plugin-sdk";
import { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

import { Args, Query, Resolver } from "type-graphql";

import { ListrrAPI } from "../datasource/listrr.datasource.ts";
import { pluginConfig } from "../listrr-plugin.config.ts";
import { ListIdsArguments } from "./arguments/list-ids.arguments.ts";

@Resolver()
export class ListrrResolver {
  @Query((_returns) => Boolean)
  async listrrIsValid(
    @PluginDataSource(pluginConfig.name, ListrrAPI) api: ListrrAPI,
  ): Promise<boolean> {
    return await api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrMovies(
    @Args() { listIds }: ListIdsArguments,
    @PluginDataSource(pluginConfig.name, ListrrAPI) api: ListrrAPI,
  ): Promise<ExternalIds[]> {
    return await api.getMovies(new Set<string>(listIds));
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrShows(
    @Args() { listIds }: ListIdsArguments,
    @PluginDataSource(pluginConfig.name, ListrrAPI) api: ListrrAPI,
  ): Promise<ExternalIds[]> {
    return await api.getShows(new Set<string>(listIds));
  }
}

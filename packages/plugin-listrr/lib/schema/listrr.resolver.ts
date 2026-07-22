import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { PluginDataSource } from "@repo/util-plugin-sdk";
import { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

import { Args, Query, Resolver } from "type-graphql";

import { ListrrAPI } from "../datasource/listrr.datasource.ts";
import { pluginConfig } from "../listrr-plugin.config.ts";
import { ListIdsArguments } from "./arguments/list-ids.arguments.ts";

@Resolver()
export class ListrrResolver {
  @Query(() => Boolean)
  public async listrrIsValid(
    @PluginDataSource(pluginConfig.name, ListrrAPI) api: ListrrAPI,
  ): Promise<boolean> {
    return api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  public async listrrMovies(
    @Args(() => ListIdsArguments) { listIds }: ListIdsArguments,
    @PluginDataSource(pluginConfig.name, ListrrAPI) api: ListrrAPI,
  ): Promise<ExternalIds[]> {
    return api.getMovies(new Set<string>(listIds));
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  public async listrrShows(
    @Args(() => ListIdsArguments) { listIds }: ListIdsArguments,
    @PluginDataSource(pluginConfig.name, ListrrAPI) api: ListrrAPI,
  ): Promise<ExternalIds[]> {
    return api.getShows(new Set<string>(listIds));
  }
}

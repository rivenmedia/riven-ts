import { ListIdsArguments } from "./arguments/list-ids.arguments.ts";
import { ExternalIds } from "./types/external-ids.type.ts";
import type { ListrrContextSlice } from "../datasource/listrr.datasource.ts";
import { pluginConfig } from "../listrr-plugin.config.ts";
import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { Args, Query, Resolver } from "type-graphql";
import { PluginContext } from "@repo/util-plugin-sdk";

@Resolver()
export class ListrrResolver {
  @Query((_returns) => Boolean)
  async listrrIsValid(
    @PluginContext(pluginConfig.name) { api }: ListrrContextSlice,
  ): Promise<boolean> {
    return await api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrMovies(
    @Args() { listIds }: ListIdsArguments,
    @PluginContext(pluginConfig.name) { api }: ListrrContextSlice,
  ): Promise<ExternalIds[]> {
    return await api.getMovies(new Set<string>(listIds));
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrShows(
    @Args() { listIds }: ListIdsArguments,
    @PluginContext(pluginConfig.name) { api }: ListrrContextSlice,
  ): Promise<ExternalIds[]> {
    return await api.getShows(new Set<string>(listIds));
  }
}

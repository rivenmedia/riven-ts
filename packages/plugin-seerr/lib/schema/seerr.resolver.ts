import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { PluginDataSource } from "@repo/util-plugin-sdk";
import { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

import { Args, Query, Resolver } from "type-graphql";

import { SeerrAPI } from "../datasource/seerr.datasource.ts";
import { pluginConfig } from "../seerr-plugin.config.ts";
import { FilterArguments } from "./arguments/filter.arguments.ts";

@Resolver()
export class SeerrResolver {
  @Query((_returns) => Boolean)
  async seerrIsValid(
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<boolean> {
    return await api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async seerrMovies(
    @Args() { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    return await api.getMovies(filter);
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async seerrShows(
    @Args() { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    return await api.getShows(filter);
  }
}

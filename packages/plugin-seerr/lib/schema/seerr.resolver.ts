import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";

import { PluginDataSource } from "@rivenmedia/plugin-sdk";
import { ExternalIds } from "@rivenmedia/plugin-sdk/schemas/external-ids.type";

import { Args, Query, Resolver } from "type-graphql";

import { SeerrAPI } from "../datasource/seerr.datasource.ts";
import { pluginConfig } from "../seerr-plugin.config.ts";
import { FilterArguments } from "./arguments/filter.arguments.ts";

@Resolver()
export class SeerrResolver {
  @Query(() => Boolean)
  seerrIsValid(
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<boolean> {
    return api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  async seerrMovies(
    @Args() { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    return (await api.getContent(filter)).movies;
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  async seerrShows(
    @Args() { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    return (await api.getContent(filter)).shows;
  }
}

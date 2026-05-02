import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { PluginDataSource } from "@rivenmedia/plugin-sdk";

import { Args, Query, Resolver } from "type-graphql";

import { MdblistAPI } from "../datasource/mdblist.datasource.ts";
import { pluginConfig } from "../mdblist-plugin.config.ts";
import { ListNamesArguments } from "./arguments/list-names.arguments.ts";
import { MdblistContentServiceResponse } from "./types/mdblist-response.type.ts";

import type { ContentServiceRequestedResponse } from "@rivenmedia/plugin-sdk/schemas/events/content-service-requested.event";

@Resolver()
export class MdblistResolver {
  @Query(() => Boolean)
  mdblistIsValid(
    @PluginDataSource(pluginConfig.name, MdblistAPI) api: MdblistAPI,
  ): Promise<boolean> {
    return api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => MdblistContentServiceResponse)
  mdbListItems(
    @Args() { listNames }: ListNamesArguments,
    @PluginDataSource(pluginConfig.name, MdblistAPI) api: MdblistAPI,
  ): Promise<ContentServiceRequestedResponse> {
    return api.getListItems(new Set<string>(listNames));
  }
}

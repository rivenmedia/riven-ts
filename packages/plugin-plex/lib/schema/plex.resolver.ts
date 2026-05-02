import { PluginDataSource } from "@rivenmedia/plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { PlexAPI } from "../datasource/plex.datasource.ts";
import { pluginConfig } from "../plex-plugin.config.ts";

@Resolver()
export class PlexResolver {
  @Query(() => Boolean)
  plexIsValid(@PluginDataSource(pluginConfig.name, PlexAPI) api: PlexAPI) {
    return api.validate();
  }
}

import { PluginDataSource } from "@repo/util-plugin-sdk/decorators";

import { Query, Resolver } from "type-graphql";

import { PlexAPI } from "../datasource/plex.datasource.ts";
import { pluginConfig } from "../plex-plugin.config.ts";

@Resolver()
export class PlexResolver {
  @Query((_returns) => Boolean)
  plexIsValid(@PluginDataSource(pluginConfig.name, PlexAPI) api: PlexAPI) {
    return api.validate();
  }
}

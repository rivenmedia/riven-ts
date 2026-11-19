import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Authorized, Query, Resolver } from "type-graphql";

import { TorrentioAPI } from "../datasource/torrentio.datasource.ts";
import { pluginConfig } from "../torrentio-plugin.config.ts";

@Authorized()
@Resolver()
export class TorrentioResolver {
  @Query(() => Boolean)
  public async torrentioIsValid(
    @PluginDataSource(pluginConfig.name, TorrentioAPI) api: TorrentioAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}

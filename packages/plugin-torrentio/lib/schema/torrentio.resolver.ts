import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { TorrentioAPI } from "../datasource/torrentio.datasource.ts";
import { pluginConfig } from "../torrentio-plugin.config.ts";

@Resolver()
export class TorrentioResolver {
  @Query((_returns) => Boolean)
  async torrentioIsValid(
    @PluginDataSource(pluginConfig.name, TorrentioAPI) api: TorrentioAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}

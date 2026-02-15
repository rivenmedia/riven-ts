import packageJson from "../package.json" with { type: "json" };
import { TorrentioAPI } from "./datasource/torrentio.datasource.ts";
import { TorrentioSettingsResolver } from "./schema/torrentio-settings.resolver.ts";
import { TorrentioResolver } from "./schema/torrentio.resolver.ts";
import { pluginConfig } from "./torrentio-plugin.config.ts";
import { TorrentioSettings } from "./torrentio-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TorrentioAPI],
  resolvers: [TorrentioResolver, TorrentioSettingsResolver],
  hooks: {
    "riven.media-item.scrape.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(TorrentioAPI);
      const results = await api.scrape(event);

      return {
        id: event.item.id,
        results,
      };
    },
  },
  settingsSchema: TorrentioSettings,
  async validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;

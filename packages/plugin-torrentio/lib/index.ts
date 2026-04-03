import packageJson from "../package.json" with { type: "json" };
import { TorrentioAPI } from "./datasource/torrentio.datasource.ts";
import { pluginConfig } from "./torrentio-plugin.config.ts";
import { TorrentioSettings } from "./torrentio-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TorrentioAPI],
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
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;

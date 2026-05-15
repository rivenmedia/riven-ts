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
      const scrapedStreams = await api.scrape(event);

      // The current `MediaItemScrapeRequestedResponse` SDK contract carries
      // only `Record<infoHash, rawTitle>`. The captured size / seeders fields
      // are intentionally dropped here until the contract is widened in a
      // follow-up commit (see the migration introducing `stream.size` /
      // `stream.seeders` / `stream.leechers`).
      const results: Record<string, string> = {};

      for (const [infoHash, { rawTitle }] of Object.entries(scrapedStreams)) {
        results[infoHash] = rawTitle;
      }

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

import packageJson from "../package.json" with { type: "json" };
import { pluginConfig } from "./comet-plugin.config.ts";
import { CometSettings } from "./comet-settings.schema.ts";
import { CometAPI } from "./datasource/comet.datasource.ts";
import { CometSettingsResolver } from "./schema/comet-settings.resolver.ts";
import { CometResolver } from "./schema/comet.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [CometAPI],
  resolvers: [CometResolver, CometSettingsResolver],
  hooks: {
    "riven.media-item.scrape.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(CometAPI);
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
  settingsSchema: CometSettings,
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;

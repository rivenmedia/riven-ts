import packageJson from "../package.json" with { type: "json" };
import { StremThruAPI } from "./datasource/stremthru.datasource.ts";
import { StremThruSettingsResolver } from "./schema/stremthru-settings.resolver.ts";
import { StremThruResolver } from "./schema/stremthru.resolver.ts";
import { pluginConfig } from "./stremthru-plugin.config.ts";
import { StremThruSettings } from "./stremthru-settings.schema.ts";

import type { Store } from "./schemas/store.schema.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [StremThruAPI],
  resolvers: [StremThruResolver, StremThruSettingsResolver],
  hooks: {
    "riven.media-item.download.requested": async ({
      dataSources,
      event: { infoHash },
    }) => {
      const api = dataSources.get(StremThruAPI);
      const store = "realdebrid" satisfies Store;

      try {
        return await api.addTorrent(infoHash, store);
      } catch (error) {
        throw new Error(
          `Failed to get instant availability from ${store}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
    "riven.media-item.download.cache-check-requested": async ({
      dataSources,
      event: { infoHashes },
    }) => {
      const api = dataSources.get(StremThruAPI);
      const store = "realdebrid" satisfies Store;

      try {
        return await api.getCachedTorrents(infoHashes, store);
      } catch (error) {
        throw new Error(
          `Failed to get cache torrent status from ${store}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
    "riven.media-item.stream-link.requested": async ({
      dataSources,
      event,
    }) => {
      const api = dataSources.get(StremThruAPI);
      const store = "realdebrid" satisfies Store;

      if (!event.item.downloadUrl) {
        throw new Error("No download URL available for this media item.");
      }

      try {
        const { download: url } = await api.generateLink(
          event.item.downloadUrl,
          store,
        );

        return { url };
      } catch (error) {
        throw new Error(
          `Failed to generate link from ${store}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  },
  settingsSchema: StremThruSettings,
  async validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;

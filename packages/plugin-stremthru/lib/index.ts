import packageJson from "../package.json" with { type: "json" };
import { StremThruAPI } from "./datasource/stremthru.datasource.ts";
import { StremThruSettingsResolver } from "./schema/stremthru-settings.resolver.ts";
import { StremThruResolver } from "./schema/stremthru.resolver.ts";
import { Store } from "./schemas/store.schema.ts";
import { pluginConfig } from "./stremthru-plugin.config.ts";
import { StoreKeys, StremThruSettings } from "./stremthru-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [StremThruAPI],
  resolvers: [StremThruResolver, StremThruSettingsResolver],
  hooks: {
    "riven.media-item.download.requested": async ({
      dataSources,
      event: { infoHash, provider: rawStore },
    }) => {
      const api = dataSources.get(StremThruAPI);
      const store = Store.parse(rawStore);

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
      event: { infoHashes, provider: rawStore },
    }) => {
      const api = dataSources.get(StremThruAPI);
      const store = Store.parse(rawStore);

      try {
        return await api.getCachedTorrents(infoHashes, store);
      } catch (error) {
        throw new Error(
          `Failed to get cache torrent status: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    "riven.media-item.download.provider-list-requested": async ({
      settings,
    }) => {
      const stremthruSettings = settings.get(StremThruSettings);

      const enabledProviders = Object.keys(StoreKeys.shape).reduce<Store[]>(
        (acc, val) => {
          const apiKey = stremthruSettings[val as keyof StoreKeys];

          if (!apiKey) {
            return acc;
          }

          acc.push(Store.parse(val.replace("ApiKey", "")));

          return acc;
        },
        [],
      );

      return {
        providers: enabledProviders,
      };
    },
    "riven.media-item.scrape.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(StremThruAPI);
      const results = await api.scrape(event);

      return {
        id: event.item.id,
        results,
      };
    },
    "riven.media-item.stream-link.requested": async ({
      dataSources,
      event,
    }) => {
      const api = dataSources.get(StremThruAPI);
      const parsedStore = Store.safeParse(event.item.provider);

      if (!event.item.downloadUrl) {
        throw new Error("No download URL available for this media item.");
      }

      if (!parsedStore.success) {
        throw new Error(parsedStore.error.message);
      }

      const { data: store } = parsedStore;

      try {
        return await api.generateLink(event.item.downloadUrl, store);
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
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;

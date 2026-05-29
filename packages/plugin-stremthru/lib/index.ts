import { DataSourceHTTPError, type RivenPlugin } from "@repo/util-plugin-sdk";

import packageJson from "../package.json" with { type: "json" };
import { StremThruTorzAPI } from "./datasource/stremthru-torz.datasource.ts";
import { StremThruTorznabAPI } from "./datasource/stremthru-torznab.datasource.ts";
import { StremThruSettingsResolver } from "./schema/stremthru-settings.resolver.ts";
import { StremThruResolver } from "./schema/stremthru.resolver.ts";
import { Store } from "./schemas/store.schema.ts";
import { pluginConfig } from "./stremthru-plugin.config.ts";
import { StremThruSettings } from "./stremthru-settings.schema.ts";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [StremThruTorzAPI, StremThruTorznabAPI],
  resolvers: [StremThruResolver, StremThruSettingsResolver],
  hooks: {
    "riven.media-item.download.requested": async ({
      dataSources,
      event: { infoHash, provider: rawStore },
    }) => {
      const api = dataSources.get(StremThruTorzAPI);
      const store = Store.parse(rawStore);

      try {
        const { files, id } = await api.addTorrent(infoHash, store);

        return {
          success: true,
          data: {
            torrentId: id,
            files,
          },
        };
      } catch (error) {
        if (error instanceof DataSourceHTTPError) {
          return {
            success: false,
            statusCode: error.response.status,
          };
        }

        throw new Error(
          `Failed to get instant availability for ${infoHash} from ${store}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
    "riven.media-item.download.cache-check-requested": async ({
      dataSources,
      event: { infoHashes, provider: rawStore },
    }) => {
      const api = dataSources.get(StremThruTorzAPI);
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
      dataSources,
      settings,
    }) => {
      const { validStores, rateLimitedStores } =
        dataSources.get(StremThruTorzAPI);
      const { storePriority } = settings.get(StremThruSettings);

      const providers = new Set(storePriority)
        .intersection(validStores)
        .difference(new Set(rateLimitedStores.keys()));

      return {
        providers: Array.from(providers),
        rateLimitedProviders: Object.fromEntries(rateLimitedStores),
      };
    },
    "riven.media-item.scrape.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(StremThruTorznabAPI);
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
      const api = dataSources.get(StremThruTorzAPI);
      const parsedStore = Store.safeParse(event.item.provider);

      if (!event.item.downloadUrl) {
        throw new Error("No download URL available for this media item.");
      }

      if (!parsedStore.success) {
        throw new Error(parsedStore.error.message);
      }

      const { data: store } = parsedStore;

      try {
        const link = await api.generateLink(event.item.downloadUrl, store);

        return {
          success: true,
          data: {
            link,
          },
        };
      } catch (error) {
        if (error instanceof DataSourceHTTPError) {
          return {
            success: false,
            statusCode: error.response.status,
          };
        }

        throw new Error(
          `Failed to generate link from ${store}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  },
  settingsSchema: StremThruSettings,
  async validator({ dataSources }) {
    const results = await Promise.all([
      dataSources.get(StremThruTorzAPI).validate(),
      dataSources.get(StremThruTorznabAPI).validate(),
    ]);

    return results.every((isValid) => isValid);
  },
} satisfies RivenPlugin as RivenPlugin;

import { DataSourceHTTPError } from "@repo/util-plugin-sdk";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import packageJson from "../package.json" with { type: "json" };
import { StremThruTorzAPI } from "./datasource/stremthru-torz.datasource.ts";
import { StremThruTorznabAPI } from "./datasource/stremthru-torznab.datasource.ts";
import { StremThruSettingsResolver } from "./schema/stremthru-settings.resolver.ts";
import { StremThruResolver } from "./schema/stremthru.resolver.ts";
import { Store } from "./schemas/store.schema.ts";
import { pluginConfig } from "./stremthru-plugin.config.ts";
import { StremThruSettings } from "./stremthru-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

/**
 * Stores whose `getTorrent` file link is already a directly-streamable CDN URL.
 * Every other store returns a `stremthru://` locked-link placeholder that only
 * link/generate can resolve, so those must be piped through generateLink; for
 * these two that call is a no-op echo, so skipping it avoids a wasted request.
 * A denylist (not an allowlist) is used deliberately: a missing entry only
 * costs one redundant request, whereas a wrongly-listed store would serve an
 * unresolved placeholder and break playback.
 */
const DIRECT_LINK_STORES = new Set<Store>(["premiumize", "debridlink"]);

export const plugin: RivenPlugin = {
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
          { cause: error },
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
          { cause: error },
        );
      }
    },
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

      return Promise.resolve({
        providers: [...providers],
        rateLimitedProviders: Object.fromEntries(rateLimitedStores),
      });
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
      logger,
      settings,
    }) => {
      if (!event.item.downloadUrl && !event.item.providerDownloadId) {
        throw new Error("No download URL available for this media item.");
      }

      const parsedStore = Store.safeParse(event.item.provider);

      if (!parsedStore.success) {
        throw new Error(parsedStore.error.message);
      }

      const api = dataSources.get(StremThruTorzAPI);
      const pluginSettings = settings.get(StremThruSettings);

      const { data: store } = parsedStore;

      if (!pluginSettings[`${store}ApiKey`]) {
        // If an item is requested with a since-removed provider,
        // return a fatal status code so the core can re-process the item.
        return {
          success: false,
          statusCode: StatusCodes.GONE,
        };
      }

      // link/generate echoes an expired signed URL back unchanged, so only the
      // durable providerDownloadId can mint a fresh link once downloadUrl ages out.
      if (event.item.providerDownloadId) {
        try {
          const torrent = await api.getTorrent(
            event.item.providerDownloadId,
            store,
          );

          const file =
            torrent.files.find(
              (candidate) => candidate.name === event.item.originalFilename,
            ) ??
            torrent.files.find(
              (candidate) =>
                candidate.path === event.item.originalFilename ||
                candidate.path.endsWith(`/${event.item.originalFilename}`),
            );

          if (file?.link) {
            // Stores like torbox return an unresolved `stremthru://`
            // locked-link placeholder here; link/generate resolves it into a
            // signed CDN URL. Direct-link stores already return a usable URL,
            // so the generate call is skipped for them (see DIRECT_LINK_STORES).
            const link = DIRECT_LINK_STORES.has(store)
              ? file.link
              : await api.generateLink(file.link, store);

            return {
              success: true,
              data: {
                link,
                isPermalink: false,
                // 3h is a heuristic: StremThru does not expose the real
                // signature lifetime, so we re-check health periodically.
                expiresAt: DateTime.utc().plus({ hours: 3 }).toISO(),
              },
            };
          }

          logger.warn(
            `No usable file link found on ${store} for torrent ${event.item.providerDownloadId} (file: ${event.item.originalFilename}); falling back to legacy link generation.`,
          );
        } catch (error) {
          logger.warn(
            `Failed to regenerate link from ${store} torrent ${event.item.providerDownloadId}; falling back to legacy link generation: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      const { downloadUrl } = event.item;

      if (!downloadUrl) {
        throw new Error(
          `Unable to regenerate stream link from ${store} for torrent ${event.item.providerDownloadId ?? "unknown"} and no legacy download URL is available.`,
        );
      }

      try {
        const link = await api.generateLink(downloadUrl, store);

        return {
          success: true,
          data: {
            link,
            isPermalink: false,
            expiresAt: DateTime.utc().plus({ hours: 3 }).toISO(),
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
          { cause: error },
        );
      }
    },
    "riven.media-item.stream-link.health-check.requested": async ({
      dataSources,
      event: { link, item },
    }) => {
      const response = await fetch(link, {
        method: "HEAD",
        headers: {
          "user-agent": `Riven StremThru/${packageJson.version}`,
          range: "bytes=0-0",
        },
      });

      const deadStatusCodes = new Set<StatusCodes>([
        StatusCodes.NOT_FOUND,
        StatusCodes.GONE,
        StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
      ]);

      // Debrid CDNs answer 403 when the URL signature has expired; the torrent
      // itself is still available, so this must never classify as dead.
      const expiredStatusCodes = new Set<StatusCodes>([StatusCodes.FORBIDDEN]);

      if (item.provider === "torbox") {
        expiredStatusCodes.add(StatusCodes.BAD_REQUEST);
      }

      const state =
        (deadStatusCodes.has(response.status) ? "dead" : null) ??
        (expiredStatusCodes.has(response.status) ? "expired" : null) ??
        (response.ok ? "healthy" : "failed");

      if (state === "failed") {
        throw new Error(
          `Failed to check stream link health: Received status code ${response.status.toString()} for URL ${link}`,
        );
      }

      // A lapsed subscription answers 403 (or 400 on torbox) on every link,
      // indistinguishable from a genuinely expired URL signature. Reporting
      // "expired" for an account-level failure would drive the core flow to
      // refresh, fail, then blacklist — deleting healthy torrents across the
      // whole library. Verify the store is still active before doing so.
      if (state === "expired") {
        const parsedStore = Store.safeParse(item.provider);

        if (parsedStore.success) {
          const subscriptionStatus = await dataSources
            .get(StremThruTorzAPI)
            .getSubscriptionStatus(parsedStore.data);

          if (subscriptionStatus === "expired") {
            throw new Error(
              `Cannot health-check stream link for ${parsedStore.data}: the store subscription is expired.`,
            );
          }
        }
      }

      return {
        state,
        statusCode: response.status,
      };
    },
  },
  settingsSchema: StremThruSettings,
  async validator({ dataSources }) {
    const results = await Promise.all([
      dataSources.get(StremThruTorzAPI).validate(),
      dataSources.get(StremThruTorznabAPI).validate(),
    ]);

    return results.every(Boolean);
  },
};

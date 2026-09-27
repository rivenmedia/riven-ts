import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { PlexDiscoverAPI } from "./datasource/plex-discover.datasource.ts";
import { PlexRSSAPI } from "./datasource/plex-rss.datasource.ts";
import { PlexAPI } from "./datasource/plex.datasource.ts";
import { pluginConfig } from "./plex-plugin.config.ts";
import { PlexSettings } from "./plex-settings.schema.ts";
import { PlexSettingsResolver } from "./schema/plex-settings.resolver.ts";
import { PlexResolver } from "./schema/plex.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export const plugin: RivenPlugin = {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [PlexAPI, PlexDiscoverAPI, PlexRSSAPI],
  resolvers: [PlexResolver, PlexSettingsResolver],
  hooks: {
    "riven.media-item.download.success": async ({
      dataSources,
      event,
      logger,
    }) => {
      const plexAPI = dataSources.get(PlexAPI);
      const mediaEntries = await event.item.getMediaEntries();

      if (mediaEntries.length === 0) {
        throw new Error(
          `No media filesystem entry found for media item ID ${event.item.id}`,
        );
      }

      const sectionPathsSet = new Set<string>();

      for (const entry of mediaEntries) {
        sectionPathsSet.add(
          path.join(entry.baseDirectory, path.dirname(entry.path)),
        );
      }

      const sectionPaths = [...sectionPathsSet];

      const results = await Promise.allSettled(
        sectionPaths.map(async (sectionPath) =>
          plexAPI.updateSection(sectionPath),
        ),
      );

      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        )
        .map((result) =>
          result.reason instanceof Error
            ? result.reason
            : new Error(String(result.reason)),
        );

      if (errors.length > 0) {
        throw new Error(
          `Failed to update library sections for ${event.item.fullTitle}. ${errors.map((error) => error.message).join(", ")}`,
          { cause: errors },
        );
      }

      logger.info(
        `Updated ${results.length.toString()} paths for ${event.item.fullTitle}`,
      );
    },
    "riven.content-service.requested": async ({
      dataSources,
      settings,
      logger,
    }) => {
      const { updateIntervalSeconds, watchlistEnabled } =
        settings.get(PlexSettings);

      if (!watchlistEnabled) {
        return {
          movies: [],
          shows: [],
          updateIntervalSeconds: null,
        };
      }

      const discoverApi = dataSources.get(PlexDiscoverAPI);
      const rssApi = dataSources.get(PlexRSSAPI);

      const watchlistItems = await discoverApi.getUserWatchlist();
      const rssItems = await rssApi.getRSSWatchlists();

      const movies: ContentServiceRequestedResponse["movies"] = [];
      const shows: ContentServiceRequestedResponse["shows"] = [];

      const seenGuids = new Set<string>();

      for (const item of [...watchlistItems, ...rssItems]) {
        const request: ContentServiceRequestedResponse[
          | "movies"
          | "shows"][number] = {};

        const guidSet = new Set(
          item.Guid.map(({ id, type }) => `${type}://${id}`),
        );

        const isDuplicateItem = guidSet.intersection(seenGuids).size > 0;

        if (isDuplicateItem) {
          continue;
        }

        for (const { id, type } of item.Guid) {
          seenGuids.add(`${type}://${id}`);

          if (type === "imdb") {
            request.imdbId = id;
          } else if (type === "tmdb" && item.type === "movie") {
            request.tmdbId = id;
          } else if (type === "tvdb" && item.type === "show") {
            request.tvdbId = id;
          }
        }

        if (Object.keys(request).length === 0) {
          logger.warn(
            `Unable to extract external IDs from ${item.year ? `${item.title} (${item.year.toString()})` : item.title}`,
          );

          continue;
        }

        if (item.type === "movie") {
          movies.push(request);
        } else {
          shows.push(request);
        }
      }

      return {
        movies,
        shows,
        updateIntervalSeconds,
      };
    },
  },
  settingsSchema: PlexSettings,
  async validator({ dataSources }) {
    return dataSources.get(PlexAPI).validate();
  },
};

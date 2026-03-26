import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { PlexCommunityAPI } from "./datasource/plex-community.datasource.ts";
import { PlexMetadataAPI } from "./datasource/plex-metadata.datasource.ts";
import { PlexTvAPI } from "./datasource/plex-tv.datasource.ts";
import { PlexAPI } from "./datasource/plex.datasource.ts";
import { pluginConfig } from "./plex-plugin.config.ts";
import { PlexSettings } from "./plex-settings.schema.ts";
import { PlexSettingsResolver } from "./schema/plex-settings.resolver.ts";
import { PlexResolver } from "./schema/plex.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [PlexAPI, PlexTvAPI, PlexCommunityAPI, PlexMetadataAPI],
  resolvers: [PlexResolver, PlexSettingsResolver],
  hooks: {
    "riven.content-service.requested": async ({ dataSources, settings }) => {
      const { lists } = settings.get(PlexSettings);
      const tvApi = dataSources.get(PlexTvAPI);
      const communityApi = dataSources.get(PlexCommunityAPI);
      const metadataApi = dataSources.get(PlexMetadataAPI);

      const userUuid = tvApi.getUserUuid();

      if (!userUuid) {
        throw new Error("Failed to get Plex user UUID from PlexTvAPI");
      }

      const listSlugs = lists
        .map((list) => {
          const parts = list.split("/");
          return parts[parts.length - 1];
        })
        .filter((slug): slug is string => Boolean(slug));

      const itemIds = await communityApi.getListItemIds(
        new Set(listSlugs),
        userUuid,
      );

      return {
        movies: await Promise.all(
          itemIds.movies
            .values()
            .map((guid) => metadataApi.convertPlexIdToExternalIds(guid)),
        ),
        shows: await Promise.all(
          itemIds.shows
            .values()
            .map((guid) => metadataApi.convertPlexIdToExternalIds(guid)),
        ),
      };
    },
    "riven.media-item.download.success": async ({
      dataSources,
      event,
      logger,
    }) => {
      const plexAPI = dataSources.get(PlexAPI);
      const mediaEntries = await event.item.getMediaEntries();

      if (mediaEntries.length === 0) {
        throw new Error(
          `No media filesystem entry found for media item ID ${event.item.id.toString()}`,
        );
      }

      const sectionPaths = mediaEntries
        .reduce<Set<string>>(
          (acc, entry) =>
            acc.add(path.join(entry.baseDirectory, path.dirname(entry.path))),
          new Set<string>(),
        )
        .values()
        .toArray();

      const results = await Promise.allSettled(
        sectionPaths.map((sectionPath) => plexAPI.updateSection(sectionPath)),
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
  },
  settingsSchema: PlexSettings,
  validator({ dataSources }) {
    const plexTvApi = dataSources.get(PlexTvAPI);
    return plexTvApi.validate();
  },
} satisfies RivenPlugin as RivenPlugin;

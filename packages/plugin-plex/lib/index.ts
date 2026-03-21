import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { PlexAPI } from "./datasource/plex.datasource.ts";
import { pluginConfig } from "./plex-plugin.config.ts";
import { PlexSettings } from "./plex-settings.schema.ts";
import { PlexSettingsResolver } from "./schema/plex-settings.resolver.ts";
import { PlexResolver } from "./schema/plex.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [PlexAPI],
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
          `Failed to update Plex library sections for ${event.item.fullTitle}. ${errors.map((error) => error.message).join(", ")}`,
          { cause: errors },
        );
      }

      logger.info(
        `Plex updated ${results.length.toString()} paths for ${event.item.fullTitle}`,
      );
    },
  },
  settingsSchema: PlexSettings,
  async validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;

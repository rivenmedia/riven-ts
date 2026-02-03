import { logger } from "@repo/core-util-logger";

import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { PlexAPI } from "./datasource/plex.datasource.ts";
import { pluginConfig } from "./plex-plugin.config.ts";
import { plexSettingsSchema } from "./plex-settings.schema.ts";
import { PlexSettingsResolver } from "./schema/plex-settings.resolver.ts";
import { PlexResolver } from "./schema/plex.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [PlexAPI],
  resolvers: [PlexResolver, PlexSettingsResolver],
  hooks: {
    "riven.media-item.download.success": async ({ dataSources, event }) => {
      const plexAPI = dataSources.get(PlexAPI);

      if (!event.item.mediaEntry) {
        throw new Error(
          `No media filesystem entry found for media item ID ${event.item.id.toString()}`,
        );
      }

      const success = await plexAPI.updateSection(
        path.dirname(event.item.mediaEntry.path),
      );

      if (!success) {
        throw new Error(
          `Failed to find matching Plex library section for media item ID ${event.item.id.toString()}`,
        );
      }

      logger.info(`Plex updated for path "${event.item.mediaEntry.path}"`);
    },
  },
  settingsSchema: plexSettingsSchema,
  validator() {
    return true;
  },
} satisfies RivenPlugin;

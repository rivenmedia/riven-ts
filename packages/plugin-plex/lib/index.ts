import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { PlexAPI } from "./datasource/plex.datasource.ts";
import { pluginConfig } from "./plex-plugin.config.ts";
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

      const mediaEntry = event.item.filesystemEntries.find(
        (entry) => entry.type === "media",
      ) as MediaEntry | undefined;

      if (!mediaEntry) {
        throw new Error(
          `No media filesystem entry found for media item ID ${event.item.id.toString()}`,
        );
      }

      await plexAPI.updateSection(
        path.dirname(
          path.join(
            mediaEntry.mediaItem.getProperty("baseDirectory") ?? "",
            mediaEntry.path,
          ),
        ),
      );
    },
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;

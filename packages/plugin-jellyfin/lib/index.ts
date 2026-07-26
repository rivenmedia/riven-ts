import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { JellyfinAPI } from "./datasource/jellyfin.datasource.ts";
import { pluginConfig } from "./jellyfin-plugin.config.ts";
import { JellyfinSettings } from "./jellyfin-settings.schema.ts";
import { JellyfinSettingsResolver } from "./schema/jellyfin-settings.resolver.ts";
import { JellyfinResolver } from "./schema/jellyfin.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export const plugin: RivenPlugin = {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [JellyfinAPI],
  resolvers: [JellyfinResolver, JellyfinSettingsResolver],
  hooks: {
    "riven.media-item.download.success": async ({
      dataSources,
      event,
      logger,
    }) => {
      const jellyfinAPI = dataSources.get(JellyfinAPI);
      const mediaEntries = await event.item.getMediaEntries();

      if (mediaEntries.length === 0) {
        throw new Error(
          `No media filesystem entry found for media item ID ${event.item.id}`,
        );
      }

      const sectionPathsSet = new Set<string>();

      for (const entry of mediaEntries) {
        const relativeDirectory = path.dirname(entry.path);

        // Library sections mean one item can be visible at several paths, all
        // of which need refreshing. Older events carry no directories, so the
        // built-in root derived from the entry remains the fallback.
        const roots = event.libraryDirectories?.length
          ? event.libraryDirectories
          : [entry.baseDirectory];

        for (const root of roots) {
          sectionPathsSet.add(path.join(root, relativeDirectory));
        }
      }

      const sectionPaths = [...sectionPathsSet];

      await jellyfinAPI.updateSections(sectionPaths);

      logger.info(
        `Updated ${sectionPaths.length.toString()} path${sectionPaths.length === 1 ? "" : "s"} for ${event.item.fullTitle}`,
      );
    },
  },
  settingsSchema: JellyfinSettings,
  async validator({ dataSources }) {
    const jellyfinAPI = dataSources.get(JellyfinAPI);

    return jellyfinAPI.validate();
  },
};

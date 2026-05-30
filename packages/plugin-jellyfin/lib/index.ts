import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { JellyfinAPI } from "./datasource/jellyfin.datasource.ts";
import { pluginConfig } from "./jellyfin-plugin.config.ts";
import { JellyfinSettings } from "./jellyfin-settings.schema.ts";
import { JellyfinSettingsResolver } from "./schema/jellyfin-settings.resolver.ts";
import { JellyfinResolver } from "./schema/jellyfin.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
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

      const sectionPaths = mediaEntries
        .reduce<Set<string>>(
          (acc, entry) =>
            acc.add(path.join(entry.baseDirectory, path.dirname(entry.path))),
          new Set<string>(),
        )
        .values()
        .toArray();

      await jellyfinAPI.updateSections(sectionPaths);

      logger.info(
        `Updated ${sectionPaths.length.toString()} path${sectionPaths.length !== 1 ? "s" : ""} for ${event.item.fullTitle}`,
      );
    },
  },
  settingsSchema: JellyfinSettings,
  validator({ dataSources }) {
    const jellyfinAPI = dataSources.get(JellyfinAPI);

    return jellyfinAPI.validate();
  },
} satisfies RivenPlugin as RivenPlugin;

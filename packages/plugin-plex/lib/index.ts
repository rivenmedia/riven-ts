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
    "riven.core.started": async ({ dataSources }) => {
      const plexAPI = dataSources.get(PlexAPI);

      await plexAPI.updateSection("/library/sections");
    },
    // Add more hooks as needed
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;

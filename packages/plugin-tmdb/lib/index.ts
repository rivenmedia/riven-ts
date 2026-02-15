import packageJson from "../package.json" with { type: "json" };
import { TmdbAPI } from "./datasource/tmdb.datasource.ts";
import { indexTMDBMediaItem } from "./hooks/index-tmdb-media-item.ts";
import { TmdbSettingsResolver } from "./schema/tmdb-settings.resolver.ts";
import { TmdbResolver } from "./schema/tmdb.resolver.ts";
import { pluginConfig } from "./tmdb-plugin.config.ts";
import { TmdbSettings } from "./tmdb-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TmdbAPI],
  resolvers: [TmdbResolver, TmdbSettingsResolver],
  hooks: {
    "riven.media-item.index.requested": indexTMDBMediaItem,
  },
  settingsSchema: TmdbSettings,
  async validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;

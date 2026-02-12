import packageJson from "../package.json" with { type: "json" };
import { TvdbAPI } from "./datasource/tvdb.datasource.ts";
import { indexTVDBMediaItem } from "./hooks/index-tvdb-media-item.ts";
import { TvdbSettingsResolver } from "./schema/tvdb-settings.resolver.ts";
import { TvdbResolver } from "./schema/tvdb.resolver.ts";
import { pluginConfig } from "./tvdb-plugin.config.ts";
import { TvdbSettings } from "./tvdb-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TvdbAPI],
  resolvers: [TvdbResolver, TvdbSettingsResolver],
  hooks: {
    "riven.media-item.index.requested": indexTVDBMediaItem,
  },
  settingsSchema: TvdbSettings,
  async validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;

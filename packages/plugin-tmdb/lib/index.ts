import packageJson from "../package.json" with { type: "json" };
import { TmdbAPI } from "./datasource/tmdb.datasource.ts";
import { indexTMDBMediaItemHandler } from "./handlers/index-media-item.ts";
import { TmdbSettingsResolver } from "./schema/tmdb-settings.resolver.ts";
import { TmdbResolver } from "./schema/tmdb.resolver.ts";
import { pluginConfig } from "./tmdb-plugin.config.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TmdbAPI],
  resolvers: [TmdbResolver, TmdbSettingsResolver],
  hooks: {
    "riven.media-item.index.requested": indexTMDBMediaItemHandler,
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;

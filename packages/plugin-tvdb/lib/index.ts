import packageJson from "../package.json" with { type: "json" };
import { TvdbAPI } from "./datasource/tvdb.datasource.ts";
import { TvdbSettingsResolver } from "./schema/tvdb-settings.resolver.ts";
import { TvdbResolver } from "./schema/tvdb.resolver.ts";
import { pluginConfig } from "./tvdb-plugin.config.ts";
import { tvdbSettingsSchema } from "./tvdb-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TvdbAPI],
  resolvers: [TvdbResolver, TvdbSettingsResolver],
  hooks: {
    "riven.core.started": async () => {},
    // Add more hooks as needed
  },
  settingsSchema: tvdbSettingsSchema,
  validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;

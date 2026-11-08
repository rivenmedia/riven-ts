import packageJson from "../package.json" with { type: "json" };
import { SiloAPI } from "./datasource/silo.datasource.ts";
import { SiloResolver } from "./schema/silo.resolver.ts";
import { pluginConfig } from "./silo-plugin.config.ts";
import { SiloSettings } from "./silo-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export const plugin: RivenPlugin = {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [SiloAPI],
  resolvers: [SiloResolver],
  hooks: {},
  settingsSchema: SiloSettings,
  async validator({ dataSources }) {
    return dataSources.get(SiloAPI).validate();
  },
};

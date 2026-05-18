import packageJson from "../package.json" with { type: "json" };
import { MeteorAPI } from "./datasource/meteor.datasource.ts";
import { pluginConfig } from "./meteor-plugin.config.ts";
import { MeteorSettings } from "./meteor-settings.schema.ts";
import { MeteorSettingsResolver } from "./schema/meteor-settings.resolver.ts";
import { MeteorResolver } from "./schema/meteor.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [MeteorAPI],
  resolvers: [MeteorResolver, MeteorSettingsResolver],
  hooks: {
    "riven.media-item.scrape.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(MeteorAPI);
      const results = await api.scrape(event);

      return {
        id: event.item.id,
        results,
      };
    },
  },
  settingsSchema: MeteorSettings,
  validator({ dataSources }) {
    return dataSources.get(MeteorAPI).validate();
  },
} satisfies RivenPlugin as RivenPlugin;

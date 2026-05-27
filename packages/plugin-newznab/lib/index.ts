import packageJson from "../package.json" with { type: "json" };
import { NewznabAPI } from "./datasource/newznab.datasource.ts";
import { pluginConfig } from "./newznab-plugin.config.ts";
import { NewznabSettings } from "./newznab-settings.schema.ts";
import { NewznabSettingsResolver } from "./schema/newznab-settings.resolver.ts";
import { NewznabResolver } from "./schema/newznab.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [NewznabAPI],
  resolvers: [NewznabResolver, NewznabSettingsResolver],
  hooks: {
    "riven.media-item.nzb-scrape.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(NewznabAPI);
      const candidates = await api.scrape(event);

      return {
        candidates,
      };
    },
  },
  settingsSchema: NewznabSettings,
  async validator({ dataSources }) {
    const api = dataSources.get(NewznabAPI);
    return api.validate();
  },
} satisfies RivenPlugin as RivenPlugin;

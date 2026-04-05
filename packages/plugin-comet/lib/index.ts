import packageJson from "../package.json" with { type: "json" };
import { pluginConfig } from "./comet-plugin.config.ts";
import { CometSettings } from "./comet-settings.schema.ts";
import { CometAPI } from "./datasource/comet.datasource.ts";
import { CometSettingsResolver } from "./schema/comet-settings.resolver.ts";
import { CometResolver } from "./schema/comet.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk/schemas";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [CometAPI],
  resolvers: [CometResolver, CometSettingsResolver],
  hooks: {
    "riven.media-item.scrape.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(CometAPI);
      const results = await api.scrape(event);

      return {
        id: event.item.id,
        results,
      };
    },
  },
  settingsSchema: CometSettings,
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;

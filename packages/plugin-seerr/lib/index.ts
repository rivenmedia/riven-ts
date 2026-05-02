import packageJson from "../package.json" with { type: "json" };
import { SeerrAPI } from "./datasource/seerr.datasource.ts";
import { SeerrSettingsResolver } from "./schema/seerr-settings.resolver.ts";
import { SeerrResolver } from "./schema/seerr.resolver.ts";
import { pluginConfig } from "./seerr-plugin.config.ts";
import { SeerrSettings } from "./seerr-settings.schema.ts";

import type { RivenPlugin } from "@rivenmedia/plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [SeerrAPI],
  resolvers: [SeerrResolver, SeerrSettingsResolver],
  hooks: {
    "riven.content-service.requested": ({ dataSources, settings }) => {
      const { filter } = settings.get(SeerrSettings);
      const api = dataSources.get(SeerrAPI);

      return api.getContent(filter);
    },
  },
  settingsSchema: SeerrSettings,
  validator({ dataSources }) {
    const api = dataSources.get(SeerrAPI);

    return api.validate();
  },
} satisfies RivenPlugin as RivenPlugin;

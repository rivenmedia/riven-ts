import packageJson from "../package.json" with { type: "json" };
import { SeerrAPI } from "./datasource/seerr.datasource.ts";
import { SeerrSettingsResolver } from "./schema/seerr-settings.resolver.ts";
import { SeerrResolver } from "./schema/seerr.resolver.ts";
import { pluginConfig } from "./seerr-plugin.config.ts";
import { SeerrSettings } from "./seerr-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export const plugin: RivenPlugin = {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [SeerrAPI],
  resolvers: [SeerrResolver, SeerrSettingsResolver],
  hooks: {
    "riven.content-service.requested": async ({ dataSources, settings }) => {
      const { filter, updateIntervalSeconds } = settings.get(SeerrSettings);
      const api = dataSources.get(SeerrAPI);

      const { movies, shows } = await api.getContent(filter);

      return {
        movies,
        shows,
        updateIntervalSeconds,
      };
    },
  },
  settingsSchema: SeerrSettings,
  async validator({ dataSources }) {
    return dataSources.get(SeerrAPI).validate();
  },
};

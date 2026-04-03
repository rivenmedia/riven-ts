import packageJson from "../package.json" with { type: "json" };
import { SeerrAPI } from "./datasource/seerr.datasource.ts";
import { pluginConfig } from "./seerr-plugin.config.ts";
import { SeerrSettings } from "./seerr-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [SeerrAPI],
  hooks: {
    "riven.content-service.requested": async ({ dataSources, settings }) => {
      const { filter } = settings.get(SeerrSettings);
      const api = dataSources.get(SeerrAPI);

      return await api.getContent(filter);
    },
  },
  settingsSchema: SeerrSettings,
  async validator({ dataSources }) {
    const api = dataSources.get(SeerrAPI);

    return await api.validate();
  },
} satisfies RivenPlugin as RivenPlugin;

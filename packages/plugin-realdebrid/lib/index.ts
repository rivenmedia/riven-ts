import packageJson from "../package.json" with { type: "json" };
import { RealDebridAPI } from "./datasource/realdebrid.datasource.ts";
import { pluginConfig } from "./realdebrid-plugin.config.ts";
import { RealDebridSettingsResolver } from "./schema/realdebrid-settings.resolver.ts";
import { RealDebridResolver } from "./schema/realdebrid.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [RealDebridAPI],
  resolvers: [RealDebridResolver, RealDebridSettingsResolver],
  hooks: {
    "riven.media-item.download.requested": async ({ dataSources, event }) => {
      const api = dataSources.get(RealDebridAPI);

      try {
        return await api.getInstantAvailability(event.item);
      } catch (error) {
        throw new Error(
          `Failed to get instant availability from RealDebrid: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;

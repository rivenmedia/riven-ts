import { CoreStartedEventHandler } from "@repo/util-plugin-sdk/program-to-plugin-events/core/started";

import packageJson from "../package.json" with { type: "json" };
import { ListrrAPI } from "./datasource/listrr.datasource.ts";
import { pluginConfig } from "./listrr-plugin.config.ts";
import { ListrrSettingsResolver } from "./schema/listrr-settings.resolver.ts";
import { ListrrResolver } from "./schema/listrr.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  resolvers: [ListrrResolver, ListrrSettingsResolver],
  dataSources: [ListrrAPI],
  hooks: {
    "riven.core.started": CoreStartedEventHandler.implementAsync(
      async ({ dataSources, publishEvent }) => {
        const api = dataSources.get(ListrrAPI);

        for (const show of await api.getShows(
          new Set(["6941fe52770814e293788237"]),
        )) {
          await publishEvent({
            type: "riven-plugin.media-item.requested",
            item: show,
          });
        }
      },
    ),
  },
  validator: () => true,
} satisfies RivenPlugin;

import { type RivenPlugin } from "@repo/util-plugin-sdk";
import { CoreStartedEventHandler } from "@repo/util-plugin-sdk/program-to-plugin-events/core/started";

import { ListrrAPI } from "./datasource/listrr.datasource.ts";
import { pluginConfig } from "./listrr-plugin.config.ts";
import { ListrrSettingsResolver } from "./schema/listrr-settings.resolver.ts";
import { ListrrResolver } from "./schema/listrr.resolver.ts";

export default {
  name: pluginConfig.name,
  resolvers: [ListrrResolver, ListrrSettingsResolver],
  dataSources: [ListrrAPI],
  hooks: {
    "riven.core.started": CoreStartedEventHandler.implementAsync(
      async ({ dataSources, publishEvent }) => {
        const api = dataSources.get(ListrrAPI);

        for (const show of await api.getShows(
          new Set(["6941fe52770814e293788237"]),
        )) {
          publishEvent({
            type: "riven-plugin.media-item.requested",
            item: show,
          });
        }
      },
    ),
    "riven.media-item.creation.already-exists": ({ event }) => {
      console.log(
        "Listrr Plugin noticed media item already exists:",
        event.item,
      );
    },
    "riven.media-item.creation.error": ({ event }) => {
      console.error(
        "Listrr Plugin noticed media item creation error:",
        event.error,
      );
    },
    "riven.media-item.creation.success": ({ event }) => {
      console.log(
        "Listrr Plugin noticed media item created successfully:",
        event.item,
      );
    },
  },
  validator: () => true,
} satisfies RivenPlugin;

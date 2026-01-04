import { type RivenPlugin, createPluginRunner } from "@repo/util-plugin-sdk";

import { ListrrAPI } from "./datasource/listrr.datasource.ts";
import { pluginConfig } from "./listrr-plugin.config.ts";
import { ListrrSettingsResolver } from "./schema/listrr-settings.resolver.ts";
import { ListrrResolver } from "./schema/listrr.resolver.ts";

export default {
  name: pluginConfig.name,
  resolvers: [ListrrResolver, ListrrSettingsResolver],
  dataSources: [ListrrAPI],
  runner: createPluginRunner(
    ({ input: { dataSources }, helpers: { publishEvent }, receive }) => {
      const api = dataSources.get(ListrrAPI);

      async function handleStarted() {
        for (const show of await api.getShows(
          new Set(["6941fe52770814e293788237"]),
        )) {
          publishEvent("riven-plugin.media-item.requested", {
            item: show,
          });
        }
      }

      receive((event) => {
        switch (event.type) {
          case "riven.started":
            void handleStarted();
            break;
          case "riven.media-item.creation.error":
            console.error(
              "Listrr Plugin received media item creation error:",
              event.error,
            );
            break;
          case "riven.media-item.creation.success":
            console.log(
              "Listrr Plugin received created media item:",
              event.item,
            );
            break;
        }
      });

      return () => {
        console.log("Listrr Plugin runner stopped");
      };
    },
  ),
  validator: () => true,
} satisfies RivenPlugin;

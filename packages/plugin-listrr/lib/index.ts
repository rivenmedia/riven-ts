import { ListrrAPI } from "./datasource/listrr.datasource.ts";
import { pluginConfig } from "./listrr-plugin.config.ts";
import { ListrrSettingsResolver } from "./schema/listrr-settings.resolver.ts";
import { ListrrResolver } from "./schema/listrr.resolver.ts";
import { createPluginRunner, type RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  resolvers: [ListrrResolver, ListrrSettingsResolver],
  dataSources: [ListrrAPI],
  runner: createPluginRunner(
    async ({ input: { dataSources }, helpers: { publishEvent } }) => {
      const api = dataSources.get(ListrrAPI);

      for (const show of await api.getShows(
        new Set(["6941fe52770814e293788237"]),
      )) {
        publishEvent("media:requested", {
          item: show,
        });
      }

      return () => {
        console.log("Listrr Plugin runner stopped");
      };
    },
  ),
} satisfies RivenPlugin;

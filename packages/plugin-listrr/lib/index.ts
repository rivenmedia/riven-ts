import packageJson from "../package.json" with { type: "json" };
import { ListrrAPI } from "./datasource/listrr.datasource.ts";
import { pluginConfig } from "./listrr-plugin.config.ts";
import { ListrrSettings } from "./listrr-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [ListrrAPI],
  hooks: {
    "riven.content-service.requested": async ({ dataSources, settings }) => {
      const { movieLists, showLists } = settings.get(ListrrSettings);
      const api = dataSources.get(ListrrAPI);

      return {
        movies: await api.getMovies(new Set(movieLists)),
        shows: await api.getShows(new Set(showLists)),
      };
    },
  },
  settingsSchema: ListrrSettings,
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;

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
    "riven.content-service.requested": async ({ dataSources }) => {
      const api = dataSources.get(ListrrAPI);

      return {
        movies: await api.getMovies(
          new Set([
            "691484300c6d7b5843f6a227",
            "65bd72e26224f985ef3189c7",
            "68cdc0945f522ebf76edbf0e",
            "64520884a8261e19949319f5",
          ]),
        ),
        shows: [],
      };
    },
  },
  validator: () => true,
} satisfies RivenPlugin;

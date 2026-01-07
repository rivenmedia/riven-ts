import { TmdbAPI } from "./datasource/tmdb.datasource.ts";
import { TmdbSettingsResolver } from "./schema/tmdb-settings.resolver.ts";
import { TmdbResolver } from "./schema/tmdb.resolver.ts";
import { pluginConfig } from "./tmdb-plugin.config.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  dataSources: [TmdbAPI],
  resolvers: [TmdbResolver, TmdbSettingsResolver],
  hooks: {
    "riven.media-item.creation.success": async ({
      dataSources,
      event,
      publishEvent,
    }) => {
      if (!event.item.tmdbId && !event.item.imdbId) {
        return;
      }

      const { imdbId, tmdbId } = event.item;
      const api = dataSources.get(TmdbAPI);

      if (imdbId && !tmdbId) {
        const results = await api.getFromExternalId(imdbId, "imdb");

        console.log(results);
      }
    },
    // Add more hooks as needed
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;

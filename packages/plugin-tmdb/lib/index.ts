import { logger } from "@repo/core-util-logger";

import packageJson from "../package.json" with { type: "json" };
import { TmdbAPI } from "./datasource/tmdb.datasource.ts";
import { TmdbSettingsResolver } from "./schema/tmdb-settings.resolver.ts";
import { TmdbResolver } from "./schema/tmdb.resolver.ts";
import { pluginConfig } from "./tmdb-plugin.config.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
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
        try {
          const results = await api.getFromExternalId(imdbId, "imdb");

          console.log({ results });
        } catch (error) {
          logger.error(error);
        }
      }

      if (!tmdbId) {
        logger.error(
          `No TMDB ID found for media item ${event.item.id.toString()}`,
        );
        return;
      }

      const result =
        await api.getMovieDetailsWithExternalIdsAndReleaseDates(tmdbId);

      await publishEvent({
        type: "riven-plugin.media-item.persist-movie-indexer-data",
        item: {
          id: event.item.id,
          genres: result.genres.map((genre) => genre.name),
          title: result.title,
          aliases: {},
          country: result.production_countries?.[0]?.iso_3166_1,
          rating: 0,
          contentRating: "-",
          posterUrl: result.poster_path
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : null,
          releaseDate: result.release_date,
          language: result.original_language,
        },
      });

      // console.log(results);
    },
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;

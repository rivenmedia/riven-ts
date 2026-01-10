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
    "riven.media-item.index.requested": async ({ dataSources, event }) => {
      if (!event.item.tmdbId && !event.item.imdbId) {
        throw new Error("Media item must have either a TMDB ID or an IMDB ID");
      }

      const api = dataSources.get(TmdbAPI);
      const { imdbId, tmdbId } = event.item;

      if (imdbId && !tmdbId) {
        try {
          const results = await api.findById(imdbId, {
            external_source: "imdb_id",
          });

          console.log({ results });
        } catch (error) {
          logger.error(error);
        }
      }

      if (!tmdbId) {
        logger.error(
          `No TMDB ID found for media item ${event.item.id.toString()}`,
        );

        throw new Error("No TMDB ID found for media item");
      }

      const result = await api.getMovieDetails(tmdbId);

      return {
        item: {
          id: event.item.id,
          genres: (result.genres ?? []).reduce<string[]>((acc, genre) => {
            if (!genre.name) {
              return acc;
            }

            return [...acc, genre.name];
          }, []),
          title: result.title ?? "Unknown title",
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
      };
    },
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;

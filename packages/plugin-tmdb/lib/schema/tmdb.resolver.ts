import { PluginDataSource } from "@repo/util-plugin-sdk";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import { Arg, ID, Query, Resolver } from "type-graphql";

import { TmdbAPI } from "#datasource/tmdb.datasource.ts";
import { pluginConfig } from "#tmdb-plugin.config.ts";
import { formatImageUrl } from "#utilities/format-image-url.ts";

import { TmdbTrendingMoviesTimeWindow } from "./enums/trending-time-window.enum.ts";
import { TmdbIndexerData } from "./types/tmdb-indexer-data.type.ts";

@Resolver()
export class TmdbResolver {
  @Query(() => Boolean)
  public tmdbIsValid(
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ) {
    return api.validate();
  }

  @Query(() => TmdbIndexerData)
  public async tmdbItem(
    @Arg("id", () => ID) id: string,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbIndexerData> {
    const item = await api.getMovieDetails(id);

    return {
      id,
      genres: item.genres.map((genre) => ({
        id: genre.id.toString(),
        name: genre.name,
      })),
      overview: item.overview ?? "",
      title: item.title ?? "",
      language: item.original_language ?? null,
      posterUrl: formatImageUrl(item.poster_path, "poster"),
      releaseDate: item.release_date
        ? DateTime.fromISO(item.release_date).toJSDate()
        : null,
      backdropUrl: formatImageUrl(item.backdrop_path, "backdrop"),
      type: "movie",
    };
  }

  @Query(() => [TmdbIndexerData])
  public async tmdbNowPlaying(
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbIndexerData[]> {
    const nowPlaying = await api.getNowPlaying();

    if (!nowPlaying.results?.length) {
      throw new Error("No now playing movies found.");
    }

    const mappedData = new Map<string, TmdbIndexerData>();

    for (const movie of nowPlaying.results) {
      if (!movie.id || !movie.title || !movie.overview) {
        continue;
      }

      mappedData.set(movie.id.toString(), {
        id: movie.id.toString(),
        title: movie.title,
        overview: movie.overview,
        backdropUrl: formatImageUrl(movie.backdrop_path, "backdrop"),
        posterUrl: formatImageUrl(movie.poster_path, "poster"),
        genres: [],
        genreIds: movie.genre_ids ?? [],
        language: movie.original_language ?? null,
        type: "movie",
        releaseDate: movie.release_date
          ? DateTime.fromISO(movie.release_date).toJSDate()
          : null,
      });
    }

    return [...mappedData.values()];
  }

  @Query(() => [TmdbIndexerData])
  public async tmdbTrendingMovies(
    @Arg("timeWindow", () => TmdbTrendingMoviesTimeWindow.enum)
    timeWindow: TmdbTrendingMoviesTimeWindow,
    @PluginDataSource(pluginConfig.name, TmdbAPI)
    api: TmdbAPI,
  ): Promise<TmdbIndexerData[]> {
    const trendingMovies = await api.getTrendingMovies(timeWindow);

    if (!trendingMovies.results?.length) {
      throw new Error("No trending movies found.");
    }

    const mappedData = new Map<string, TmdbIndexerData>();

    for (const movie of trendingMovies.results) {
      if (!movie.id || !movie.title || !movie.overview) {
        continue;
      }

      mappedData.set(movie.id.toString(), {
        id: movie.id.toString(),
        title: movie.title,
        overview: movie.overview,
        backdropUrl: formatImageUrl(movie.backdrop_path, "backdrop"),
        posterUrl: formatImageUrl(movie.poster_path, "poster"),
        genres: [],
        genreIds: movie.genre_ids ?? [],
        language: movie.original_language ?? null,
        type: "movie",
        releaseDate: movie.release_date
          ? DateTime.fromISO(movie.release_date).toJSDate()
          : null,
      });
    }

    return [...mappedData.values()];
  }
}

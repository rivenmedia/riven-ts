import { PluginDataSource } from "@repo/util-plugin-sdk";
import { IndexerDataStatus } from "@repo/util-plugin-sdk/dto/enums/indexer-data-status.enum";
import { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";
import { Duration } from "@repo/util-plugin-sdk/helpers/dates";

import { Arg, ID, Int, Query, Resolver } from "type-graphql";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../tmdb-plugin.config.ts";
import { createTmdbMovie } from "../utilities/create-tmdb-indexer-data.ts";
import { formatImageUrl } from "../utilities/format-image-url.ts";
import { parseTmdbDate } from "../utilities/parse-tmdb-date.ts";
import { movieListItemToTmdbMovie } from "../utilities/to-tmdb-movie.ts";
import {
  showDetailsToTmdbShow,
  showListItemsToTmdbShows,
} from "../utilities/to-tmdb-show.ts";
import { TmdbTrendingTimeWindow } from "./enums/trending-time-window.enum.ts";
import { TmdbIndexerData } from "./types/tmdb-indexer-data.type.ts";

import type { ProductionCompany } from "@repo/util-plugin-sdk/dto/types/production-company.type";
import type { SpokenLanguage } from "@repo/util-plugin-sdk/dto/types/spoken-language.type";

@Resolver()
export class TmdbResolver {
  @Query(() => Boolean)
  public tmdbIsValid(
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ) {
    return api.validate();
  }

  @Query(() => TmdbIndexerData, {
    description:
      "Look up a single item from TMDB. Movies are keyed by their TMDB ID, and shows by their TVDB ID.",
  })
  public async tmdbItem(
    @Arg("id", () => ID) id: string,
    @Arg("type", () => TopLevelMediaItemType.enum, { defaultValue: "movie" })
    type: TopLevelMediaItemType,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbIndexerData> {
    return type === "show"
      ? this.#getShowByTvdbId(api, id)
      : this.#getMovieByTmdbId(api, id);
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
      const item = movie.overview ? movieListItemToTmdbMovie(movie) : null;

      if (item) {
        mappedData.set(item.id, item);
      }
    }

    return [...mappedData.values()];
  }

  @Query(() => [TmdbIndexerData])
  public async tmdbTrendingMovies(
    @Arg("timeWindow", () => TmdbTrendingTimeWindow.enum)
    timeWindow: TmdbTrendingTimeWindow,
    @Arg("page", () => Int, { defaultValue: 1 })
    page: number,
    @PluginDataSource(pluginConfig.name, TmdbAPI)
    api: TmdbAPI,
  ): Promise<TmdbIndexerData[]> {
    const trendingMovies = await api.getTrendingMovies(timeWindow, page);

    if (!trendingMovies.results?.length) {
      throw new Error("No trending movies found.");
    }

    const mappedData = new Map<string, TmdbIndexerData>();

    for (const movie of trendingMovies.results) {
      const item = movie.overview ? movieListItemToTmdbMovie(movie) : null;

      if (item) {
        mappedData.set(item.id, item);
      }
    }

    return [...mappedData.values()];
  }

  @Query(() => [TmdbIndexerData])
  public async tmdbTrendingShows(
    @Arg("timeWindow", () => TmdbTrendingTimeWindow.enum)
    timeWindow: TmdbTrendingTimeWindow,
    @Arg("page", () => Int, { defaultValue: 1 })
    page: number,
    @PluginDataSource(pluginConfig.name, TmdbAPI)
    api: TmdbAPI,
  ): Promise<TmdbIndexerData[]> {
    const { results } = await api.getTrendingShows(timeWindow, page);

    if (results.length === 0) {
      throw new Error("No trending shows found.");
    }

    return showListItemsToTmdbShows(api, results);
  }

  async #getMovieByTmdbId(api: TmdbAPI, id: string) {
    const item = await api.getMovieDetails(id);

    return createTmdbMovie({
      id,
      genres: item.genres.map((genre) => ({
        id: genre.id.toString(),
        name: genre.name,
      })),
      overview: item.overview ?? "",
      title: item.title ?? "",
      language: item.original_language ?? null,
      posterUrl: formatImageUrl(item.poster_path, "poster"),
      releaseDate: parseTmdbDate(item.release_date),
      backdropUrl: formatImageUrl(item.backdrop_path, "backdrop"),
      rawRuntime: item.runtime
        ? Duration.fromObject({ minutes: item.runtime })
        : null,
      status: IndexerDataStatus.parse(item.status),
      imdbId: item.imdb_id ?? null,
      budget: item.budget ?? null,
      revenue: item.revenue ?? null,
      homepage: item.homepage ?? null,
      spokenLanguages:
        item.spoken_languages?.map<SpokenLanguage>((language) => ({
          englishName: language.english_name ?? "",
          iso6391Code: language.iso_639_1 ?? "",
          name: language.name ?? "",
        })) ?? null,
      productionCompanies:
        item.production_companies?.map<ProductionCompany>((company) => ({
          id: company.id?.toString() ?? "",
          name: company.name ?? "",
          logoPath: formatImageUrl(company.logo_path, "logo") ?? null,
          originCountry: company.origin_country ?? "",
        })) ?? null,
    });
  }

  async #getShowByTvdbId(api: TmdbAPI, tvdbId: string) {
    const tmdbId = await api.getShowTmdbIdFromTvdbId(tvdbId);

    if (!tmdbId) {
      throw new Error(`No TMDB show found for TVDB ID ${tvdbId}`);
    }

    const details = await api.getShowDetails(tmdbId);

    return showDetailsToTmdbShow(details);
  }
}

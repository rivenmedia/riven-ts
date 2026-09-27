import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Arg, Int, Query, Resolver } from "type-graphql";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../tmdb-plugin.config.ts";
import {
  TmdbSearchResult,
  TmdbSearchResultType,
} from "./types/tmdb-search-result.type.ts";
import { TmdbShowDetails } from "./types/tmdb-show-details.type.ts";

@Resolver()
export class TmdbResolver {
  @Query(() => Boolean)
  public tmdbIsValid(
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ) {
    return api.validate();
  }

  @Query(() => [TmdbSearchResult])
  public async tmdbSearch(
    @Arg("query", () => String) query: string,
    @Arg("page", () => Int, { nullable: true, defaultValue: 1 }) page: number,
    @Arg("language", () => String, { nullable: true })
    language: string | null,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbSearchResult[]> {
    const params = { query, page, ...(language != null && { language }) };

    const [movies, shows] = await Promise.all([
      api.searchMovies(params),
      api.searchTvShows(params),
    ]);

    const movieResults = (movies.results ?? []).flatMap((movie) => {
      if (movie.id == null || movie.id === 0) {
        return [];
      }

      return [
        {
          id: movie.id,
          mediaType: TmdbSearchResultType.enum.movie,
          title: movie.title ?? movie.original_title ?? null,
          overview: movie.overview ?? null,
          releaseDate: movie.release_date ?? null,
          posterPath: movie.poster_path ?? null,
          originalLanguage: movie.original_language ?? null,
          voteAverage: movie.vote_average ?? null,
        },
      ];
    });

    const showResults = (shows.results ?? []).flatMap((show) => {
      if (show.id == null || show.id === 0) {
        return [];
      }

      return [
        {
          id: show.id,
          mediaType: TmdbSearchResultType.enum.show,
          title: show.name ?? show.original_name ?? null,
          overview: show.overview ?? null,
          releaseDate: show.first_air_date ?? null,
          posterPath: show.poster_path ?? null,
          originalLanguage: show.original_language ?? null,
          voteAverage: show.vote_average ?? null,
        },
      ];
    });

    return [...movieResults, ...showResults].toSorted(
      (first, second) => (second.voteAverage ?? 0) - (first.voteAverage ?? 0),
    );
  }

  @Query(() => TmdbShowDetails)
  public async tmdbShowDetails(
    @Arg("id", () => Int) id: number,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbShowDetails> {
    const [details, externalIds] = await Promise.all([
      api.getTvSeriesDetails(id.toString()),
      api.getTvSeriesExternalIds(id.toString()),
    ]);

    return {
      id: details.id,
      name: details.name ?? null,
      numberOfSeasons: details.number_of_seasons ?? 0,
      tvdbId: externalIds.tvdb_id?.toString() ?? null,
    };
  }
}

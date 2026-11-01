import { BaseDataSource } from "@repo/util-plugin-sdk";
import { Duration } from "@repo/util-plugin-sdk/helpers/dates";

import { findById200Schema } from "../__generated__/zod/findByIdSchema.ts";
import { genreMovieList200Schema } from "../__generated__/zod/genreMovieListSchema.ts";
import { movieDetails200Schema } from "../__generated__/zod/movieDetailsSchema.ts";
import { movieExternalIds200Schema } from "../__generated__/zod/movieExternalIdsSchema.ts";
import { movieNowPlayingList200Schema } from "../__generated__/zod/movieNowPlayingListSchema.ts";
import { movieReleaseDates200Schema } from "../__generated__/zod/movieReleaseDatesSchema.ts";
import { trendingMovies200Schema } from "../__generated__/zod/trendingMoviesSchema.ts";
import { EpisodeCredits } from "../schemas/episode-credits.schema.ts";
import { FindEpisodesByExternalId } from "../schemas/find-episodes-by-external-id.schema.ts";
import { FindShowsByExternalId } from "../schemas/find-shows-by-external-id.schema.ts";
import { MediaImages } from "../schemas/media-images.schema.ts";
import { MediaVideos } from "../schemas/media-videos.schema.ts";
import { MovieCredits } from "../schemas/movie-credits.schema.ts";
import { MovieRecommendations } from "../schemas/movie-recommendations.schema.ts";
import { MovieSimilarItems } from "../schemas/movie-similar-items.schema.ts";
import { SearchMultiResponse } from "../schemas/search-multi.schema.ts";
import { ShowAggregateCredits } from "../schemas/show-aggregate-credits.schema.ts";
import { ShowContentRatings } from "../schemas/show-content-ratings.schema.ts";
import { ShowDetails } from "../schemas/show-details.schema.ts";
import { ShowExternalIds } from "../schemas/show-external-ids.schema.ts";
import { ShowListResponse } from "../schemas/show-list-item.schema.ts";

import type { FindByIdQueryParams } from "../__generated__/types/FindById.ts";
import type { TrendingMoviesPathParamsSchema } from "../__generated__/zod/trendingMoviesSchema.ts";
import type { TmdbSettings } from "../tmdb-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { RateLimiterOptions } from "@repo/util-plugin-sdk";

class TmdbAPIError extends Error {
  public override name = "TmdbAPIError";
}

/**
 * The media type path segment used by TMDB endpoints that exist for both movies and shows.
 */
export type TmdbMediaType = "movie" | "tv";

type TrendingTimeWindow = NonNullable<
  TrendingMoviesPathParamsSchema["time_window"]
>;

/**
 * TMDB <-> TVDB ID mappings practically never change, so they are cached for much longer
 * than TMDB's default `max-age` (~1 hour).
 */
const externalIdCacheOptions = {
  ttl: Duration.fromObject({ week: 1 }).as("seconds"),
};

export class TmdbAPI extends BaseDataSource<TmdbSettings> {
  public override baseURL = "https://api.themoviedb.org/3/";
  public override serviceName = "Tmdb";

  protected override rateLimiterOptions?: RateLimiterOptions = {
    max: 40,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    requestOpts.headers["authorization"] = `Bearer ${this.settings.apiKey}`;
  }

  public override validate() {
    return true;
  }

  public async getTmdbIdFromImdbId(imdbId: string) {
    try {
      const { movie_results: movieResults } = await this.findById(imdbId, {
        external_source: "imdb_id",
      });

      if (!movieResults?.[0]) {
        throw new TmdbAPIError(`IMDB ID ${imdbId} is not a movie`);
      }

      return movieResults[0].id;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.debug(
          `Failed to get TMDB ID from IMDB ID ${imdbId}: ${error}`,
        );
      }

      return null;
    }
  }

  /**
   * Resolve a show's TMDB ID from its TVDB ID.
   *
   * @returns The TMDB ID, or `null` if TMDB has no show with that TVDB ID
   */
  public async getShowTmdbIdFromTvdbId(tvdbId: string) {
    const response = await this.get<unknown>(`find/${tvdbId}`, {
      params: {
        external_source: "tvdb_id",
      },
      cacheOptions: externalIdCacheOptions,
    });

    const { tv_results: tvResults } = FindShowsByExternalId.parse(response);

    return tvResults[0]?.id.toString() ?? null;
  }

  /**
   * Resolve an episode's location on TMDB from its TVDB ID.
   *
   * TMDB's season and episode numbering can differ from TVDB's, so this is preferred over matching by number.
   *
   * @returns The episode's TMDB show ID, season number and episode number, or `null` if TMDB has no episode with that TVDB ID
   */
  public async getEpisodeFromTvdbId(tvdbId: string) {
    const response = await this.get<unknown>(`find/${tvdbId}`, {
      params: {
        external_source: "tvdb_id",
      },
      cacheOptions: externalIdCacheOptions,
    });

    const { tv_episode_results: episodeResults } =
      FindEpisodesByExternalId.parse(response);

    return episodeResults[0] ?? null;
  }

  public async findById(externalId: string, params: FindByIdQueryParams) {
    const response = await this.get<unknown>(`find/${externalId}`, {
      params,
    });

    return findById200Schema.parse(response);
  }

  public async getMovieDetails(movieId: string) {
    const response = await this.get<unknown>(`movie/${movieId}`);

    return movieDetails200Schema.parse(response);
  }

  public async getShowDetails(showId: string) {
    const response = await this.get<unknown>(`tv/${showId}`, {
      params: {
        append_to_response: "external_ids",
      },
    });

    return ShowDetails.parse(response);
  }

  public async getShowExternalIds(showId: string) {
    const response = await this.get<unknown>(`tv/${showId}/external_ids`, {
      cacheOptions: externalIdCacheOptions,
    });

    return ShowExternalIds.parse(response);
  }

  public async getNowPlaying() {
    const response = await this.get<unknown>(`movie/now_playing`);

    return movieNowPlayingList200Schema.parse(response);
  }

  /**
   * Movie and TV genres are separate lists in TMDB, with partially overlapping IDs.
   */
  public async getLocalisedGenres(mediaType: TmdbMediaType, locale: string) {
    const response = await this.get<unknown>(`genre/${mediaType}/list`, {
      params: {
        language: locale,
      },
    });

    // The movie and TV genre list responses share the same shape
    const { genres } = genreMovieList200Schema.parse(response);

    return genres.map((genre) => ({
      id: genre.id.toString(),
      name: genre.name,
    }));
  }

  public async searchMulti(query: string, page: number) {
    const response = await this.get<unknown>(`search/multi`, {
      params: {
        query,
        page: page.toString(),
      },
    });

    return SearchMultiResponse.parse(response);
  }

  public async getReleaseDates(tmdbId: string) {
    const response = await this.get<unknown>(`movie/${tmdbId}/release_dates`);

    return movieReleaseDates200Schema.parse(response);
  }

  public async getShowContentRatings(showId: string) {
    const response = await this.get<unknown>(`tv/${showId}/content_ratings`);

    return ShowContentRatings.parse(response);
  }

  public async getExternalIds(movieId: string) {
    const response = await this.get<unknown>(`movie/${movieId}/external_ids`);

    return movieExternalIds200Schema.parse(response);
  }

  public async getTrendingMovies(timeWindow: TrendingTimeWindow, page: number) {
    const response = await this.get<unknown>(`trending/movie/${timeWindow}`, {
      params: {
        page: page.toString(),
      },
    });

    return trendingMovies200Schema.parse(response);
  }

  public async getTrendingShows(timeWindow: TrendingTimeWindow, page: number) {
    const response = await this.get<unknown>(`trending/tv/${timeWindow}`, {
      params: {
        page: page.toString(),
      },
    });

    return ShowListResponse.parse(response);
  }

  public async getLocalisedVideos(
    mediaType: TmdbMediaType,
    id: string,
    locale?: string,
  ) {
    const response = await this.get<unknown>(`${mediaType}/${id}/videos`, {
      params: {
        language: locale,
      },
    });

    return MediaVideos.parse(response);
  }

  public async getMovieRecommendations(movieId: string) {
    const response = await this.get<unknown>(
      `movie/${movieId}/recommendations`,
    );

    return MovieRecommendations.parse(response);
  }

  public async getShowRecommendations(showId: string) {
    const response = await this.get<unknown>(`tv/${showId}/recommendations`);

    return ShowListResponse.parse(response);
  }

  public async getSimilarMovies(movieId: string) {
    const response = await this.get<unknown>(`movie/${movieId}/similar`);

    return MovieSimilarItems.parse(response);
  }

  public async getSimilarShows(showId: string) {
    const response = await this.get<unknown>(`tv/${showId}/similar`);

    return ShowListResponse.parse(response);
  }

  public async getLocalisedCredits(movieId: string, language: string) {
    const response = await this.get<unknown>(`movie/${movieId}/credits`, {
      params: {
        language,
      },
    });

    return MovieCredits.parse(response);
  }

  public async getLocalisedShowAggregateCredits(
    showId: string,
    language: string,
  ) {
    const response = await this.get<unknown>(`tv/${showId}/aggregate_credits`, {
      params: {
        language,
      },
    });

    return ShowAggregateCredits.parse(response);
  }

  public async getLocalisedEpisodeCredits(
    showId: string,
    seasonNumber: number,
    episodeNumber: number,
    language: string,
  ) {
    const response = await this.get<unknown>(
      `tv/${showId}/season/${seasonNumber.toString()}/episode/${episodeNumber.toString()}/credits`,
      {
        params: {
          language,
        },
      },
    );

    return EpisodeCredits.parse(response);
  }

  public async getLocalisedImages(
    mediaType: TmdbMediaType,
    id: string,
    language: string,
  ) {
    const response = await this.get<unknown>(`${mediaType}/${id}/images`, {
      params: {
        language,
      },
    });

    return MediaImages.parse(response);
  }
}

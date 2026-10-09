import { BaseDataSource } from "@repo/util-plugin-sdk";

import { findById200Schema } from "../__generated__/zod/findByIdSchema.ts";
import { genreMovieList200Schema } from "../__generated__/zod/genreMovieListSchema.ts";
import { movieDetails200Schema } from "../__generated__/zod/movieDetailsSchema.ts";
import { movieExternalIds200Schema } from "../__generated__/zod/movieExternalIdsSchema.ts";
import { movieNowPlayingList200Schema } from "../__generated__/zod/movieNowPlayingListSchema.ts";
import { movieReleaseDates200Schema } from "../__generated__/zod/movieReleaseDatesSchema.ts";
import { trendingMovies200Schema } from "../__generated__/zod/trendingMoviesSchema.ts";
import { MovieCredits } from "../schemas/movie-credits.schema.ts";
import { MovieImages } from "../schemas/movie-images.schema.ts";
import { MovieRecommendations } from "../schemas/movie-recommendations.schema.ts";
import { MovieSimilarItems } from "../schemas/movie-similar-items.schema.ts";
import { MovieVideos } from "../schemas/movie-videos.schema.ts";

import type { FindByIdQueryParams } from "../__generated__/types/FindById.ts";
import type { TrendingMoviesPathParamsSchema } from "../__generated__/zod/trendingMoviesSchema.ts";
import type { TmdbSettings } from "../tmdb-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { RateLimiterOptions } from "@repo/util-plugin-sdk";

class TmdbAPIError extends Error {
  public override name = "TmdbAPIError";
}

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

  public async getNowPlaying() {
    const response = await this.get<unknown>(`movie/now_playing`);

    return movieNowPlayingList200Schema.parse(response);
  }

  public async getLocalisedGenres(locale: string) {
    const response = await this.get<unknown>(`genre/movie/list`, {
      params: {
        language: locale,
      },
    });

    const { genres } = genreMovieList200Schema.parse(response);

    return genres.map((genre) => ({
      id: genre.id.toString(),
      name: genre.name,
    }));
  }

  public async getReleaseDates(tmdbId: string) {
    const response = await this.get<unknown>(`movie/${tmdbId}/release_dates`);

    return movieReleaseDates200Schema.parse(response);
  }

  public async getExternalIds(movieId: string) {
    const response = await this.get<unknown>(`movie/${movieId}/external_ids`);

    return movieExternalIds200Schema.parse(response);
  }

  public async getTrendingMovies(
    timeWindow: TrendingMoviesPathParamsSchema["time_window"],
  ) {
    const response = await this.get<unknown>(`trending/movie/${timeWindow}`);

    return trendingMovies200Schema.parse(response);
  }

  public async getLocalisedVideos(movieId: string, locale?: string) {
    const response = await this.get<unknown>(`movie/${movieId}/videos`, {
      params: {
        language: locale,
      },
    });

    return MovieVideos.parse(response);
  }

  public async getRecommendations(movieId: string) {
    const response = await this.get<unknown>(
      `movie/${movieId}/recommendations`,
    );

    return MovieRecommendations.parse(response);
  }

  public async getSimilarItems(movieId: string) {
    const response = await this.get<unknown>(`movie/${movieId}/similar`);

    return MovieSimilarItems.parse(response);
  }

  public async getLocalisedCredits(movieId: string, language: string) {
    const response = await this.get<unknown>(`movie/${movieId}/credits`, {
      params: {
        language,
      },
    });

    return MovieCredits.parse(response);
  }

  public async getLocalisedImages(movieId: string, language: string) {
    const response = await this.get<unknown>(`movie/${movieId}/images`, {
      params: {
        language,
      },
    });

    return MovieImages.parse(response);
  }
}

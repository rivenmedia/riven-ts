import { BaseDataSource } from "@repo/util-plugin-sdk";

import z from "zod";

import { findById200Schema } from "../__generated__/zod/findByIdSchema.ts";
import { movieDetails200Schema } from "../__generated__/zod/movieDetailsSchema.ts";
import { searchMovie200Schema } from "../__generated__/zod/searchMovieSchema.ts";
import { searchTv200Schema } from "../__generated__/zod/searchTvSchema.ts";

import type { FindByIdQueryParams } from "../__generated__/types/FindById.ts";
import type { TmdbSettings } from "../tmdb-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { RateLimiterOptions } from "@repo/util-plugin-sdk";

class TmdbAPIError extends Error {
  public override name = "TmdbAPIError";
}

/**
 * Only the fields exposed by this plugin are parsed.
 *
 * The generated TV series details schema rejects real TMDB payloads (e.g. it
 * expects season vote averages to be integers), and the generated external
 * IDs schema defaults `tvdb_id` to `0`, which would hide shows that are not
 * known to TVDB.
 */
const TvSeriesDetailsSchema = z.object({
  id: z.number(),
  name: z.string().nullish(),
  number_of_seasons: z.number().nullish(),
});

const TvSeriesExternalIdsSchema = z.object({
  id: z.number(),
  tvdb_id: z.number().nullish(),
});

/**
 * Removes explicit `null` values from a response.
 *
 * The TMDB API returns `null` for fields without a value (e.g. `poster_path`), but
 * parts of the generated schemas expect those fields to be absent instead of `null`.
 */
function stripNullValues<T>(value: T): T {
  return JSON.parse(JSON.stringify(value), (_key: string, val: unknown) =>
    val === null ? undefined : val,
  ) as T;
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

  public async getTvSeriesDetails(seriesId: string) {
    const response = await this.get<unknown>(`tv/${seriesId}`);

    return TvSeriesDetailsSchema.parse(response);
  }

  public async getTvSeriesExternalIds(seriesId: string) {
    const response = await this.get<unknown>(`tv/${seriesId}/external_ids`);

    return TvSeriesExternalIdsSchema.parse(response);
  }

  public async searchMovies(params: {
    query: string;
    page?: number;
    language?: string;
  }) {
    const response = await this.get<unknown>("search/movie", {
      params: {
        query: params.query,
        page: params.page?.toString(),
        language: params.language,
      },
    });

    return searchMovie200Schema.parse(stripNullValues(response));
  }

  public async searchTvShows(params: {
    query: string;
    page?: number;
    language?: string;
  }) {
    const response = await this.get<unknown>("search/tv", {
      params: {
        query: params.query,
        page: params.page?.toString(),
        language: params.language,
      },
    });

    return searchTv200Schema.parse(stripNullValues(response));
  }
}

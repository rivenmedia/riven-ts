import { BaseDataSource, type RateLimiterOptions } from "@repo/util-plugin-sdk";

import { findById200Schema } from "../__generated__/zod/findByIdSchema.ts";
import { GetMovieDetails } from "../schemas/get-movie-details.schema.ts";

import type { FindByIdQueryParams } from "../__generated__/types/FindById.ts";
import type { TmdbSettings } from "../tmdb-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";

class TmdbAPIError extends Error {}

export class TmdbAPI extends BaseDataSource<TmdbSettings> {
  override baseURL = "https://api.themoviedb.org/3/";
  override serviceName = "Tmdb";

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

  override validate() {
    return true;
  }

  async getTmdbIdFromImdbId(imdbId: string) {
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

  async findById(externalId: string, params: FindByIdQueryParams) {
    const response = await this.get<unknown>(`find/${externalId}`, {
      params,
    });

    return findById200Schema.parse(response);
  }

  async getMovieDetails(movieId: string) {
    const response = await this.get<unknown>(`movie/${movieId}`, {
      params: {
        append_to_response: "external_ids,release_dates",
      },
    });

    return GetMovieDetails.parse(response);
  }
}

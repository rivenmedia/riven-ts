import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import type {
  FindById200,
  FindByIdQueryParams,
} from "../__generated__/types/FindById.ts";
import type { MovieDetails200 } from "../__generated__/types/MovieDetails.ts";
import type { MovieExternalIds200 } from "../__generated__/types/MovieExternalIds.ts";
import type { TmdbSettings } from "../tmdb-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";

export class TmdbAPIError extends Error {}

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
        throw new Error(`IMDB ID ${imdbId} is not a movie`);
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

  findById(externalId: string, params: FindByIdQueryParams) {
    return this.get<FindById200>(`find/${externalId}`, {
      params,
    });
  }

  getMovieDetails(movieId: string) {
    return this.get<
      MovieDetails200 & {
        external_ids: MovieExternalIds200;
      }
    >(`movie/${movieId}`, {
      params: {
        append_to_response: "external_ids,release_dates",
      },
    });
  }
}

export type TmdbContextSlice = BasePluginContext;

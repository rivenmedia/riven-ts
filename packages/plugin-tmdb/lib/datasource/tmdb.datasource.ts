import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import type {
  FindById200,
  FindByIdQueryParams,
  MovieDetails200,
} from "../__generated__/index.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { Promisable } from "type-fest";

export class TmdbAPIError extends Error {}

export class TmdbAPI extends BaseDataSource {
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
    if (!this.token) {
      throw new TmdbAPIError(
        "Tmdb API token is not set. Please provide a valid API token.",
      );
    }

    requestOpts.headers["Authorization"] = `Bearer ${this.token}`;
  }

  static override getApiToken() {
    return "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZTMxMDdlNTI4NTYzYzE4Yjk0OWE1NGM3YjQwNGQwYSIsIm5iZiI6MTc2MDgwMDA1MS42MzY5OTk4LCJzdWIiOiI2OGYzYWQzMzJiOWY4NTQyZDc3OGRmZTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.5Q2n87kYQbiLI08arhWxr_DJRob6hv1EIncDmJKykBk";
  }

  override validate(): Promisable<boolean> {
    return true;
  }

  async findById(externalId: string, params: FindByIdQueryParams) {
    return await this.get<FindById200>(`find/${externalId}`, {
      params,
    });
  }

  async getMovieDetails(movieId: string) {
    return await this.get<MovieDetails200>(`movie/${movieId}`, {
      params: {
        append_to_response: "external_ids,release_dates",
      },
    });
  }
}

export type TmdbContextSlice = BasePluginContext;

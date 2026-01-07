import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOpts,
} from "@repo/util-plugin-sdk";

import type { Promisable } from "type-fest";

export class TmdbAPIError extends Error {}

export class TmdbAPI extends BaseDataSource {
  override baseURL = "https://api.themoviedb.org/3";
  override serviceName = "Tmdb";

  static override rateLimiterOptions: RateLimiterOpts = {
    tokensPerInterval: 40,
    interval: "second",
  };

  static override getApiToken(): string | undefined {
    return "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNTkxMmVmOWFhM2IxNzg2Zjk3ZTE1NWY1YmQ3ZjY1MSIsInN1YiI6IjY1M2NjNWUyZTg5NGE2MDBmZjE2N2FmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xrIXsMFJpI1o1j5g2QpQcFP1X3AfRjFA5FlBFO5Naw8";
  }

  override validate(): Promisable<boolean> {
    return true;
  }

  getFromExternalId(externalId: string, externalSource: "imdb" | "tmdb") {
    return this.get(`find/${externalId}`, {
      params: {
        external_source: externalSource,
      },
    });
  }
}

export type TmdbContextSlice = BasePluginContext;

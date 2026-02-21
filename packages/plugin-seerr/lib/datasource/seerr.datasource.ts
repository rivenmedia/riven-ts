import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import type {
  GetAuthMeQueryResponse,
  GetRequestQueryResponse,
  MediaRequest,
} from "../__generated__/index.ts";
import type { SeerrSettings } from "../seerr-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

export class SeerrAPIError extends Error {}

/**
 * The Overseerr API returns a `type` field on MediaRequest at runtime
 * indicating "movie" or "tv", but it is not documented in the OpenAPI spec.
 */
interface MediaRequestWithType extends MediaRequest {
  type: "movie" | "tv";
}

interface GetRequestResponseWithType extends GetRequestQueryResponse {
  results?: MediaRequestWithType[];
}

export class SeerrAPI extends BaseDataSource<SeerrSettings> {
  override get baseURL() {
    const url = this.settings.url.replace(/\/+$/, "");

    return `${url}/api/v1/`;
  }

  override serviceName = "Seerr";

  protected override readonly rateLimiterOptions: RateLimiterOptions = {
    max: 20,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    requestOpts.headers["x-api-key"] = this.settings.apiKey;
  }

  override async validate() {
    try {
      await this.get<GetAuthMeQueryResponse>("auth/me");

      return true;
    } catch {
      return false;
    }
  }

  async getMovies(filter: string): Promise<ExternalIds[]> {
    const requests = await this.#getAllRequests(filter);
    const idsMap = new Map<number, ExternalIds>();

    for (const request of requests) {
      if (request.type === "movie" && request.media?.tmdbId) {
        idsMap.set(request.media.tmdbId, {
          tmdbId: request.media.tmdbId.toString(),
        });
      }
    }

    return [...idsMap.values()];
  }

  async getShows(filter: string): Promise<ExternalIds[]> {
    const requests = await this.#getAllRequests(filter);
    const idsMap = new Map<number, ExternalIds>();

    for (const request of requests) {
      if (request.type === "tv" && request.media?.tmdbId) {
        idsMap.set(request.media.tmdbId, {
          tmdbId: request.media.tmdbId.toString(),
          tvdbId: request.media.tvdbId?.toString(),
        });
      }
    }

    return [...idsMap.values()];
  }

  async #getAllRequests(filter: string): Promise<MediaRequestWithType[]> {
    const allResults: MediaRequestWithType[] = [];
    const take = 20;
    let skip = 0;
    let totalResults = 0;

    do {
      const response = await this.get<GetRequestResponseWithType>("request", {
        params: {
          take: take.toString(),
          skip: skip.toString(),
          filter,
          sort: "added",
        },
        cacheOptions: {
          ttl: 60 * 2,
        },
      });

      if (response.results) {
        allResults.push(...response.results);
      }

      totalResults = response.pageInfo?.results ?? 0;
      skip += take;
    } while (skip < totalResults);

    return allResults;
  }
}

export type SeerrContextSlice = BasePluginContext;

import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import { RequestResponse } from "../schemas/request-response.schema.ts";

import type { GetAuthMeQueryResponse } from "../__generated__/index.ts";
import type { ExtendedMediaRequest } from "../schemas/extended-media-request.schema.ts";
import type { SeerrSettings } from "../seerr-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export class SeerrAPIError extends Error {}

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

  async getContent(filter: string): Promise<ContentServiceRequestedResponse> {
    const requests = await this.#getAllRequests(filter);
    const movieMap = new Map<
      number,
      ContentServiceRequestedResponse["movies"][number]
    >();
    const showMap = new Map<
      number,
      ContentServiceRequestedResponse["shows"][number]
    >();

    for (const request of requests) {
      if (request.type === "movie") {
        if (!request.media?.tmdbId) {
          continue;
        }

        movieMap.set(request.media.tmdbId, {
          tmdbId: request.media.tmdbId.toString(),
          externalRequestId: request.id.toString(),
          requestedBy: request.requestedBy?.email,
        });
      }

      if (request.type === "tv") {
        if (!request.media?.tvdbId) {
          continue;
        }

        /**
         * Seerr creates multiple requests within the same show,
         * e.g. one request for seasons 1-3, then another request for season 4.
         *
         * To handle this, we combine seasons from multiple requests for the same show into a single entry in the response.
         */
        const combinedSeasons = new Set([
          ...(showMap.get(request.media.tvdbId)?.seasons ?? []),
          ...request.seasons.map(({ seasonNumber }) => seasonNumber),
        ]);

        showMap.set(request.media.tvdbId, {
          tvdbId: request.media.tvdbId.toString(),
          externalRequestId:
            request.media.id?.toString() ?? request.id.toString(),
          requestedBy: request.requestedBy?.email,
          seasons: [...combinedSeasons],
        });
      }
    }

    return {
      movies: [...movieMap.values()],
      shows: [...showMap.values()],
    };
  }

  async #getAllRequests(filter: string): Promise<ExtendedMediaRequest[]> {
    const allResults: ExtendedMediaRequest[] = [];
    const take = 20;
    let skip = 0;
    let totalResults = 0;

    do {
      const response = await this.get<unknown>("request", {
        params: {
          take: take.toString(),
          skip: skip.toString(),
          filter,
          sort: "added",
        },
        skipCache: true,
      });

      const { results, pageInfo } = RequestResponse.parse(response);

      if (results) {
        allResults.push(...results);
      }

      totalResults = pageInfo?.results ?? 0;
      skip += take;
    } while (skip < totalResults);

    return allResults;
  }
}

export type SeerrContextSlice = BasePluginContext;

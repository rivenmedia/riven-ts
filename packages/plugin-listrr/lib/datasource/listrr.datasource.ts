import {
  BaseDataSource,
  type BasePluginContext,
  type RequestedItem,
} from "@repo/util-plugin-sdk";

import type { AugmentedRequest } from "@apollo/datasource-rest";

import {
  type GetApiListMyPageQueryResponse,
  type ListrrContractsModelsAPIPagedResponse1ListrrContractsModelsAPIMovieDtoSchema as GetMoviesResponse,
  type ListrrContractsModelsAPIPagedResponse1ListrrContractsModelsAPIShowDtoSchema as GetShowsResponse,
  getApiListMyPageQueryResponseSchema,
  listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIMovieDtoSchema as getMoviesResponseSchema,
  listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIShowDtoSchema as getShowsResponseSchema,
} from "../__generated__/index.ts";
import type { ExternalIds } from "../schema/types/external-ids.type.ts";

export class ListrrAPIError extends Error {}

export class ListrrAPI extends BaseDataSource {
  override baseURL = "https://listrr.pro/api/";
  override serviceName = "Listrr";

  static override readonly rateLimiterOptions = {
    tokensPerInterval: 50,
    interval: "second",
  } as const;

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    if (!this.token) {
      throw new ListrrAPIError(
        "Listrr API token is not set. Please provide a valid API token.",
      );
    }

    requestOpts.headers["x-api-key"] = this.token;
  }

  override async validate() {
    try {
      const response =
        await this.get<GetApiListMyPageQueryResponse>("List/My/1");

      return getApiListMyPageQueryResponseSchema.safeParse(response).success;
    } catch {
      return false;
    }
  }

  /**
   * Fetch unique show IDs from Listrr for a given list of content
   * @param contentLists
   */
  async getShows(contentLists: Set<string>): Promise<RequestedItem[]> {
    if (!contentLists.size) {
      return [];
    }

    const idsMap = new Map<string, ExternalIds>();

    for (const listId of contentLists) {
      if (listId.length !== 24) {
        this.logger.warn(`Skipping invalid list ID: ${listId}`);

        continue;
      }

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await this.get<GetShowsResponse>(
          `List/Shows/${listId}/ReleaseDate/Descending/${page.toString()}`,
          {
            cacheOptions: {
              ttl: 60 * 2,
            },
          },
        );

        const parsed = getShowsResponseSchema.parse(response);

        totalPages = parsed.pages ?? 1;

        if (parsed.items) {
          for (const item of parsed.items) {
            if (item.id) {
              idsMap.set(item.id, {
                imdbId: item.imDbId ?? undefined,
                tmdbId: item.tmDbId?.toString(),
              });
            }
          }
        }

        page++;
      }
    }

    return [...idsMap.values()];
  }

  /**
   * Fetch unique movie IDs from Listrr for a given list of content
   * @param contentLists
   */
  async getMovies(contentLists: Set<string>): Promise<RequestedItem[]> {
    if (!contentLists.size) {
      return [];
    }

    const idsMap = new Map<string, ExternalIds>();

    for (const listId of contentLists) {
      if (listId.length !== 24) {
        this.logger.warn(`Skipping invalid list ID: ${listId}`);

        continue;
      }

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await this.get<GetMoviesResponse>(
          `List/Movies/${listId}/ReleaseDate/Descending/${page.toString()}`,
          {
            cacheOptions: {
              ttl: 60 * 2,
            },
          },
        );

        const parsed = getMoviesResponseSchema.parse(response);

        totalPages = parsed.pages ?? 1;

        if (parsed.items) {
          for (const item of parsed.items) {
            if (!item.id) {
              continue;
            }

            idsMap.set(item.id, {
              imdbId: item.imDbId ?? undefined,
              tmdbId: item.tmDbId?.toString(),
            });
          }
        }

        page++;
      }
    }

    return [...idsMap.values()];
  }

  static override getApiToken() {
    return "f7f5a6871a944fb692d144eab2fde171722b5a79c5af4ac1a3f4fd225f94c3ba";
  }
}

export type ListrrContextSlice = BasePluginContext;

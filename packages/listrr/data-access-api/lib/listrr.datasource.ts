import {
  listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIShowDtoSchema as getShowsResponseSchema,
  listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIMovieDtoSchema as getMoviesResponseSchema,
  getApiListMyPageQueryResponseSchema,
  type ListrrContractsModelsAPIPagedResponse1ListrrContractsModelsAPIShowDtoSchema as GetShowsResponse,
  type ListrrContractsModelsAPIPagedResponse1ListrrContractsModelsAPIMovieDtoSchema as GetMoviesResponse,
  type GetApiListMyPageQueryResponse,
} from "./__generated__/index.ts";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";
import { RESTDataSource, type AugmentedRequest } from "@apollo/datasource-rest";
import { logger } from "@repo/core-util-logger";

export class ListrrAPIError extends Error {}

interface ExternalIds {
  imdbId: string | undefined;
  tmdbId: string | undefined;
}

export class ListrrAPI extends RESTDataSource {
  override baseURL = "https://listrr.pro/api/";

  private token: string;

  constructor(token: string) {
    super();

    this.token = token;
  }

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-api-key"] = this.token;
  }

  async validate() {
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
  async getShows(contentLists: Set<string>): Promise<ExternalIds[]> {
    if (!contentLists.size) {
      return [];
    }

    const idsMap = new Map<string, ExternalIds>();

    for (const listId of contentLists) {
      if (listId.length !== 24) {
        logger.warn(`Skipping invalid list ID: ${listId}`);

        continue;
      }

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await this.get<GetShowsResponse>(
          `List/Shows/${listId}/ReleaseDate/Descending/${page.toString()}`,
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
  async getMovies(contentLists: Set<string>): Promise<ExternalIds[]> {
    if (!contentLists.size) {
      return [];
    }

    const idsMap = new Map<string, ExternalIds>();

    for (const listId of contentLists) {
      if (listId.length !== 24) {
        logger.warn(`Skipping invalid list ID: ${listId}`);

        continue;
      }

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await this.get<GetMoviesResponse>(
          `List/Movies/${listId}/ReleaseDate/Descending/${page.toString()}`,
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
}

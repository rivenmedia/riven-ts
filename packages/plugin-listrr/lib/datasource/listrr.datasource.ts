import { BaseDataSource } from "@repo/util-plugin-sdk";

import { getApiListMyPageQueryResponseSchema } from "../__generated__/zod/getApiListMyPageSchema.ts";
import { listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIMovieDtoSchema as getMoviesResponseSchema } from "../__generated__/zod/listrr/contracts/models/API/pagedResponse1listrr/contracts/models/API/movieDtoSchema.ts";
import { listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIShowDtoSchema as getShowsResponseSchema } from "../__generated__/zod/listrr/contracts/models/API/pagedResponse1listrr/contracts/models/API/showDtoSchema.ts";

import type { ListrrSettings } from "../listrr-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { RateLimiterOptions } from "@repo/util-plugin-sdk";
import type { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

interface PagedResponseSchema<T> {
  parse: (data: unknown) => {
    items?: T[] | null | undefined;
    pages?: number | undefined;
  };
}

export class ListrrAPI extends BaseDataSource<ListrrSettings> {
  public override baseURL = "https://listrr.pro/api/";
  public override serviceName = "Listrr";

  protected override readonly rateLimiterOptions: RateLimiterOptions = {
    max: 50,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    requestOpts.headers["x-api-key"] = this.settings.apiKey;
  }

  public override async validate() {
    try {
      const response = await this.get<unknown>("List/My/1");

      return getApiListMyPageQueryResponseSchema.safeParse(response).success;
    } catch (error) {
      this.logger.error("Listrr validation error", { err: error });

      return false;
    }
  }

  /**
   * Fetch unique show IDs from Listrr for a given list of content
   * @param contentLists
   */
  public async getShows(contentLists: Set<string>): Promise<ExternalIds[]> {
    const idsMap = new Map<string, ExternalIds>();

    for (const listId of this.#getValidListIds(contentLists)) {
      const items = await this.#fetchAllListItems(
        listId,
        "Shows",
        getShowsResponseSchema,
      );

      for (const item of items) {
        if (!item.id) {
          continue;
        }

        idsMap.set(item.id, {
          imdbId: item.imDbId ?? undefined,
          tvdbId: item.tvDbId?.toString(),
          tmdbId: item.tmDbId?.toString(),
        });
      }
    }

    return [...idsMap.values()];
  }

  /**
   * Fetch unique movie IDs from Listrr for a given list of content
   * @param contentLists
   */
  public async getMovies(contentLists: Set<string>): Promise<ExternalIds[]> {
    const idsMap = new Map<string, ExternalIds>();

    for (const listId of this.#getValidListIds(contentLists)) {
      const items = await this.#fetchAllListItems(
        listId,
        "Movies",
        getMoviesResponseSchema,
      );

      for (const item of items) {
        if (!item.id) {
          continue;
        }

        idsMap.set(item.id, {
          imdbId: item.imDbId ?? undefined,
          tmdbId: item.tmDbId?.toString(),
        });
      }
    }

    return [...idsMap.values()];
  }

  #getValidListIds(contentLists: Set<string>) {
    return [...contentLists].filter((listId) => {
      const isValid = listId.length === 24;

      if (!isValid) {
        this.logger.warn(`Skipping invalid list ID: ${listId}`);
      }

      return isValid;
    });
  }

  /**
   * Fetch every page of items in a Listrr list
   */
  async #fetchAllListItems<T>(
    listId: string,
    mediaType: "Movies" | "Shows",
    responseSchema: PagedResponseSchema<T>,
  ) {
    const items: T[] = [];

    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await this.get<unknown>(
        `List/${mediaType}/${listId}/ReleaseDate/Descending/${page.toString()}`,
        {
          cacheOptions: {
            ttl: 60 * 2,
          },
        },
      );

      const parsed = responseSchema.parse(response);

      totalPages = parsed.pages ?? 1;
      items.push(...(parsed.items ?? []));

      page += 1;
    }

    return items;
  }
}

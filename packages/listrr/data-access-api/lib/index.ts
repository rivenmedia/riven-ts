import { RESTDataSource } from "@apollo/datasource-rest";
import {
  listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIShowDtoSchema as getShowsResponseSchema,
  listrrContractsModelsAPIPagedResponse1listrrContractsModelsAPIMovieDtoSchema as getMoviesResponseSchema,
} from "./__generated__/index.ts";

export class ListrrAPIError extends Error {}

export class ListrrAPI extends RESTDataSource {
  override baseURL = "https://listrr.pro/api";

  validate() {
    return this.get("/List/My");
  }

  /**
   * Fetch unique show IDs from Listrr for a given list of content
   * @param contentLists
   */
  async getShows(
    contentLists: string[],
  ): Promise<[string | undefined, string | undefined][]> {
    if (!contentLists.length) {
      return [];
    }

    const idsMap = new Map<string, [string | undefined, string | undefined]>();

    for (const listId of contentLists) {
      if (listId.length !== 24) {
        continue;
      }

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await this.get(
          `/List/Movies/${listId}/ReleaseDate/Descending/${page}`,
          {},
        );

        const parsed = getShowsResponseSchema.parse(response);

        totalPages = parsed.pages ?? 1;

        if (parsed.items) {
          for (const item of parsed.items) {
            if (!item.id) {
              continue;
            }

            idsMap.set(item.id, [
              item.imDbId ?? undefined,
              item.tmDbId?.toString(),
            ]);
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
  async getMovies(
    contentLists: string[],
  ): Promise<[string | undefined, string | undefined][]> {
    if (!contentLists.length) {
      return [];
    }

    const idsMap = new Map<string, [string | undefined, string | undefined]>();

    for (const listId of contentLists) {
      if (listId.length !== 24) {
        continue;
      }

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await this.get(
          `/List/Movies/${listId}/ReleaseDate/Descending/${page}`,
        );

        const parsed = getMoviesResponseSchema.parse(response);

        totalPages = parsed.pages ?? 1;

        if (parsed.items) {
          for (const item of parsed.items) {
            if (!item.id) {
              continue;
            }

            idsMap.set(item.id, [
              item.imDbId ?? undefined,
              item.tmDbId?.toString(),
            ]);
          }
        }
      }

      page++;
    }

    return [...idsMap.values()];
  }
}

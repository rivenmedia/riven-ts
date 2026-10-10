import { BaseDataSource } from "@repo/util-plugin-sdk";

import { getListItemsByName200Schema } from "#__generated__/zod/getListItemsByNameSchema.ts";
import { MdbListName } from "#schemas/mdblist-name.schema.ts";

import type { GetListItemsByName200Schema as ListItemsResponse } from "#__generated__/zod/getListItemsByNameSchema.ts";
import type { MdbListSettings } from "#mdblist-settings.schema.ts";
import type { MdbListExternalIds } from "#schema/types/mdblist-external-ids.type.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { RateLimiterOptions } from "@repo/util-plugin-sdk";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

class MdblistAPIError extends Error {
  public override name = "MdblistAPIError";
}

export class MdblistAPI extends BaseDataSource<MdbListSettings> {
  public override baseURL = "https://api.mdblist.com/";
  public override serviceName = "MDBList";

  protected override readonly rateLimiterOptions: RateLimiterOptions = {
    max: 50,
    duration: 1000,
  };

  readonly #seenMovieIds = new Set<number>();
  readonly #seenShowIds = new Set<number>();

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    if (!this.settings.apiKey) {
      throw new MdblistAPIError(
        "MDBList API token is not set. Please provide a valid API token.",
      );
    }

    requestOpts.params.append("apikey", this.settings.apiKey);
  }

  public override async validate() {
    try {
      await this.get("user");

      return true;
    } catch (error) {
      this.logger.error("MDBList validation error", { err: error });

      return false;
    }
  }

  public async getListItems(
    contentLists: Set<string>,
  ): Promise<Pick<ContentServiceRequestedResponse, "movies" | "shows">> {
    if (contentLists.size === 0) {
      return {
        movies: [],
        shows: [],
      };
    }

    for (const name of contentLists) {
      if (!MdbListName.safeParse(name).success) {
        throw new MdblistAPIError(
          `${name} is not a valid MDBList name, format has to be "<string>/<string>"`,
        );
      }
    }

    const movieIdsMap = new Map<number, MdbListExternalIds>();
    const showIdsMap = new Map<number, MdbListExternalIds>();

    for (const listName of contentLists) {
      await this.#fetchListItems(listName, movieIdsMap, showIdsMap);
    }

    for (const id of movieIdsMap.keys()) {
      this.#seenMovieIds.add(id);
    }
    for (const id of showIdsMap.keys()) {
      this.#seenShowIds.add(id);
    }

    return {
      movies: [...movieIdsMap.values()],
      shows: [...showIdsMap.values()],
    };
  }

  /**
   * Fetches every page of items in a list, adding any unseen items to the given maps.
   */
  async #fetchListItems(
    listName: string,
    movieIdsMap: Map<number, MdbListExternalIds>,
    showIdsMap: Map<number, MdbListExternalIds>,
  ) {
    let hasMoreItems = true;
    let offset = 0;

    while (hasMoreItems) {
      const response = await this.fetch<unknown>(`lists/${listName}/items`, {
        params: {
          offset: offset.toString(),
        },
      });

      const parsed = getListItemsByName200Schema.parse(response.parsedBody);

      offset +=
        this.#collectMovies(parsed.movies ?? [], movieIdsMap) +
        this.#collectShows(parsed.shows ?? [], showIdsMap);

      hasMoreItems = response.response.headers.get("X-Has-More") === "true";
    }
  }

  /**
   * Adds any unseen movies to the given map.
   *
   * @returns The number of valid movies in the page
   */
  #collectMovies(
    movies: NonNullable<ListItemsResponse["movies"]>,
    movieIdsMap: Map<number, MdbListExternalIds>,
  ) {
    let pageItemCount = 0;

    for (const item of movies) {
      if (!item.id) {
        continue;
      }

      pageItemCount += 1;

      if (this.#seenMovieIds.has(item.id)) {
        continue;
      }

      movieIdsMap.set(item.id, {
        imdbId: item.ids.imdb,
        tmdbId: item.ids.tmdb?.toString(),
        externalRequestId: item.ids.mdblist,
        tvdbId: item.ids.tvdb ? String(item.ids.tvdb) : undefined,
      });
    }

    return pageItemCount;
  }

  /**
   * Adds any unseen shows to the given map.
   *
   * @returns The number of valid shows in the page
   */
  #collectShows(
    shows: NonNullable<ListItemsResponse["shows"]>,
    showIdsMap: Map<number, MdbListExternalIds>,
  ) {
    let pageItemCount = 0;

    for (const item of shows) {
      if (!item.id) {
        continue;
      }

      pageItemCount += 1;

      if (this.#seenShowIds.has(item.id)) {
        continue;
      }

      showIdsMap.set(item.id, {
        imdbId: item.imdb_id ?? undefined,
        tvdbId: item.tvdb_id?.toString(),
      });
    }

    return pageItemCount;
  }
}

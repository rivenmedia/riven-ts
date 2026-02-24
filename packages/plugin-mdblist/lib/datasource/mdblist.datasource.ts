import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import {
  type GetListItemsByNameQueryResponse,
  getListItemsByName200Schema as getListItemsResponseSchema,
} from "../__generated__/index.ts";

import type { MdbListSettings } from "../mdblist-settings.schema.ts";
import type { MdbListExternalIds } from "../schema/types/mdblist-external-ids.type.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export type MdblistName = `${string}/${string}`;
function isMdblistName(name: unknown): name is MdblistName {
  return /^[^/]+\/[^/]+$/.test(String(name));
}

export class MdblistAPIError extends Error {}

export class MdblistAPI extends BaseDataSource<MdbListSettings> {
  override baseURL = "https://api.mdblist.com/";
  override serviceName = "MDBList";

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

  override async validate() {
    try {
      await this.get("user");

      return true;
    } catch {
      return false;
    }
  }

  async getListItems(
    contentLists: Set<string>,
  ): Promise<ContentServiceRequestedResponse> {
    if (!contentLists.size) {
      return {
        movies: [],
        shows: [],
      };
    }

    contentLists.forEach((name) => {
      if (!isMdblistName(name)) {
        throw new MdblistAPIError(
          `${name} is not a valid MDBList name, format has to be "<string>/<string>"`,
        );
      }
    });

    const movieIdsMap = new Map<number, MdbListExternalIds>();
    const showIdsMap = new Map<number, MdbListExternalIds>();

    for (const listName of contentLists) {
      let hasMoreItems = true;
      let offset = 0;

      while (hasMoreItems) {
        const response = await this.fetch<GetListItemsByNameQueryResponse>(
          `lists/${listName}/items`,
          {
            params: {
              offset: offset.toString(),
            },
          },
        );

        const parsed = getListItemsResponseSchema.parse(response.parsedBody);

        let pageItemCount = 0;

        if (parsed.movies) {
          for (const item of parsed.movies) {
            if (item.id) {
              pageItemCount++;
              if (!this.#seenMovieIds.has(item.id)) {
                movieIdsMap.set(item.id, {
                  imdbId: item.ids.imdb,
                  tmdbId: item.ids.tmdb?.toString(),
                  externalRequestId: item.ids.mdblist,
                  tvdbId: item.ids.tvdb ? String(item.ids.tvdb) : undefined,
                });
              }
            }
          }
        }

        if (parsed.shows) {
          for (const item of parsed.shows) {
            if (item.id) {
              pageItemCount++;
              if (!this.#seenShowIds.has(item.id)) {
                showIdsMap.set(item.id, {
                  imdbId: item.imdb_id,
                  tvdbId: item.tvdb_id.toString(),
                });
              }
            }
          }
        }

        offset += pageItemCount;
        hasMoreItems = response.response.headers.get("X-Has-More") == "true";
      }
    }

    for (const id of movieIdsMap.keys()) {
      this.#seenMovieIds.add(id);
    }
    for (const id of showIdsMap.keys()) {
      this.#seenShowIds.add(id);
    }

    return {
      movies: Array.from(movieIdsMap.values()),
      shows: Array.from(showIdsMap.values()),
    };
  }
}

export type MdblistContextSlice = BasePluginContext;

import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import {
  type GetListItemsByNameQueryResponse,
  getListItemsByName200Schema as getListItemsResponseSchema,
} from "../__generated__/index.ts";

import type { MdbListExternalIds } from "../schema/types/external-ids.type.ts";
import type { AugmentedRequest, GetRequest } from "@apollo/datasource-rest";

export type MdblistName = `${string}/${string}`;
function isMdblistName(name: unknown): name is MdblistName {
  return String(name).includes("/");
}

export class MdblistAPIError extends Error {}

export class MdblistAPI extends BaseDataSource {
  override baseURL = "https://api.mdblist.com/";
  override serviceName = "MDBList";

  protected override readonly rateLimiterOptions: RateLimiterOptions = {
    max: 50,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    if (!this.token) {
      throw new MdblistAPIError(
        "MDBList API token is not set. Please provide a valid API token.",
      );
    }

    requestOpts.params.append("apikey", this.token);
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
  ): Promise<{ movies: MdbListExternalIds[]; shows: MdbListExternalIds[] }> {
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

      while (hasMoreItems) {
        const response = await this.fetch<GetListItemsByNameQueryResponse>(
          `lists/${listName}/items`,
          {
            cacheOptions: {
              ttl: 60 * 2,
            },
          },
        );

        const parsed = getListItemsResponseSchema.parse(response.parsedBody);

        if (parsed.movies) {
          for (const item of parsed.movies) {
            if (item.id) {
              movieIdsMap.set(item.id, {
                imdbId: item.ids.imdb,
                tmdbId: item.ids.tmdb?.toString(),
                mdblistId: item.ids.mdblist,
                tvdbId: item.ids.tvdb ? String(item.ids.tvdb) : undefined,
              });
            }
          }
        }

        if (parsed.shows) {
          for (const item of parsed.shows) {
            if (item.id) {
              showIdsMap.set(item.id, {
                imdbId: item.imdb_id,
                tvdbId: item.tvdb_id.toString(),
              });
            }
          }
        }

        hasMoreItems = response.response.headers.get("X-Has-More") == "true";
      }
    }

    return {
      movies: Array.from(movieIdsMap.values()),
      shows: Array.from(showIdsMap.values()),
    };
  }

  static override getApiToken() {
    return process.env["MDBLIST_API_KEY"];
  }
}

export type MdblistContextSlice = BasePluginContext;

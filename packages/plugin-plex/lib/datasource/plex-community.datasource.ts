import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

import { PlexSettings } from "../plex-settings.schema.ts";
import { ListItemsResponse } from "../schemas/list-items-response.schema.ts";
import { ListResponse } from "../schemas/list-response.schema.ts";

import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class PlexCommunityAPIError extends Error {}

export class PlexCommunityAPI extends BaseDataSource<PlexSettings> {
  override baseURL = "https://community.plex.tv/api";

  override serviceName = "Plex Community";

  userUuid?: string;

  readonly #seenMovieIds = new Set<string>();
  readonly #seenShowIds = new Set<string>();

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-plex-token"] = this.settings.plexToken;
    requestOpts.headers["accept"] = "application/json";
  }

  async getListItemIds(
    _contentLists: Set<string>,
    _userUuid: string,
  ): Promise<{
    movies: Set<string>;
    shows: Set<string>;
  }> {
    if (_contentLists.size === 0) {
      return {
        movies: new Set(),
        shows: new Set(),
      };
    }

    let hasNextPage = false;
    let endCursor: string | null = null;

    let lists: ListResponse["data"]["user"]["customLists"]["nodes"] = [];

    try {
      do {
        const res = await this.post<unknown>(``, {
          body: JSON.stringify({
            query: `{
              user(id: "${_userUuid}") {
                customLists(first: 10 ${endCursor ? `, after: "${endCursor}"` : ""}) {
                  pageInfo { hasNextPage endCursor }
                  nodes {
                    id
                    name
                    slug
                    itemCount
                  }
                }
              }
            }`,
          }),
        });

        const data = ListResponse.parse(res);

        hasNextPage = data.data.user.customLists.pageInfo.hasNextPage;
        endCursor = data.data.user.customLists.pageInfo.endCursor;
        lists = lists.concat(data.data.user.customLists.nodes);
      } while (hasNextPage && endCursor);

      const movieIdsMap = new Set<string>();
      const showIdsMap = new Set<string>();

      const contentListSlugs = _contentLists
        .values()
        .map((list) => list.split("/").pop() ?? "")
        .filter((slug) => slug !== "")
        .toArray();
      const targetListIds = new Set(
        lists
          .filter((list) => contentListSlugs.includes(list.slug))
          .map((list) => list.id),
      );

      // Paginate through all lists, fetching items for target lists along the way
      let listsCursor: string | null = null;
      let hasMoreLists = true;

      while (hasMoreLists) {
        // Get list to see if it contains any of our target lists and to get cursors for paginating through items
        const res = await this.post<unknown>(``, {
          body: JSON.stringify({
            query: `{
              user(id: "${_userUuid}") {
                customLists(first: 10${listsCursor ? `, after: "${listsCursor}"` : ""}) {
                  pageInfo { hasNextPage endCursor }
                  nodes {
                    id
                    metadataItems(first: 5) {
                      pageInfo { hasNextPage endCursor }
                      nodes { id title type year guid }
                    }
                  }
                }
              }
            }`,
          }),
        });

        const data = ListItemsResponse.parse(res);
        const { nodes, pageInfo } = data.data.user.customLists;

        for (const node of nodes) {
          // Skip lists that aren't in our target set
          if (!targetListIds.has(node.id)) continue;

          this.#processItems(node.metadataItems.nodes, movieIdsMap, showIdsMap);

          // Drain remaining items for this list
          let itemsCursor = node.metadataItems.pageInfo.endCursor;
          let hasMoreItems = node.metadataItems.pageInfo.hasNextPage;

          while (hasMoreItems && itemsCursor) {
            const itemsRes = await this.post<unknown>(``, {
              body: JSON.stringify({
                query: `{
                  user(id: "${_userUuid}") {
                    customLists(first: 2) {
                      nodes {
                        id
                        metadataItems(first: 100, after: "${itemsCursor}") {
                          pageInfo { hasNextPage endCursor }
                          nodes { id title type year guid }
                        }
                      }
                    }
                  }
                }`,
              }),
            });

            const itemsData = ListItemsResponse.parse(itemsRes);
            const targetList = itemsData.data.user.customLists.nodes.find(
              (n) => n.id === node.id,
            );
            if (!targetList) break;

            this.#processItems(
              targetList.metadataItems.nodes,
              movieIdsMap,
              showIdsMap,
            );
            hasMoreItems = targetList.metadataItems.pageInfo.hasNextPage;
            itemsCursor = targetList.metadataItems.pageInfo.endCursor;
          }
        }

        hasMoreLists = pageInfo.hasNextPage;
        listsCursor = pageInfo.endCursor;
      }

      return {
        movies: movieIdsMap,
        shows: showIdsMap,
      };
    } catch (err: unknown) {
      this.logger.error("Error fetching Plex community list items", { err });
      throw new PlexCommunityAPIError(
        "Failed to fetch Plex community list items",
      );
    }
  }

  #processItems(
    items: ListItemsResponse["data"]["user"]["customLists"]["nodes"][number]["metadataItems"]["nodes"],
    movieIdsMap: Set<string>,
    showIdsMap: Set<string>,
  ): void {
    for (const item of items) {
      if (item.type.toLowerCase() === "movie") {
        if (!this.#seenMovieIds.has(item.id)) {
          movieIdsMap.add(item.id);
          this.#seenMovieIds.add(item.id);
        }
      } else if (item.type.toLowerCase() === "show") {
        if (!this.#seenShowIds.has(item.id)) {
          showIdsMap.add(item.id);
          this.#seenShowIds.add(item.id);
        }
      }
    }
  }

  override validate() {
    return true;
  }
}

export type PlexContextSlice = BasePluginContext;

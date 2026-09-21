import { BaseDataSource } from "@repo/util-plugin-sdk";

import { UserWatchlistResponse } from "../schemas/user-watchlist-response.schema.ts";

import type { PlexSettings } from "../plex-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class PlexDiscoverAPI extends BaseDataSource<PlexSettings> {
  public override baseURL = "https://discover.provider.plex.tv";

  public override serviceName = "Plex [Discover]";

  /**
   * @see https://developer.plex.tv/pms/#section/API-Info/Pagination
   */
  readonly #defaultContainerSize = 100;

  /**
   * @see https://developer.plex.tv/pms/#section/API-Info/Pagination
   */
  readonly #defaultContainerStart = 0;

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-plex-token"] = this.settings.plexToken;
    requestOpts.headers["accept"] = "application/json";
  }

  public async getUserWatchlist() {
    const items: UserWatchlistResponse["MediaContainer"]["Metadata"] = [];

    let containerStart = this.#defaultContainerStart;
    let requiresPagination = false;
    let seenItemCount = 0;

    do {
      const response = await this.get<unknown>(
        "library/sections/watchlist/all",
        {
          headers: {
            "X-Plex-Container-Size": this.#defaultContainerSize.toString(),
            "X-Plex-Container-Start": containerStart.toString(),
          },
          params: {
            includeGuids: "1",
            includeElements: "Guid",
            includeFields: ["type", "title", "year"].join(","),
          },
        },
      );

      const {
        MediaContainer: { Metadata: metadataItems, size, totalSize },
      } = UserWatchlistResponse.parse(response);

      requiresPagination = (seenItemCount += size) < totalSize;
      containerStart += this.#defaultContainerSize;

      items.push(...metadataItems);
    } while (requiresPagination);

    return items;
  }

  // Nothing to validate here; the main PlexAPI datasource will catch config errors
  public override validate() {
    return true;
  }
}

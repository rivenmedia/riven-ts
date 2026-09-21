import { BaseDataSource } from "@repo/util-plugin-sdk";

import { RSSWatchlistResponse } from "../schemas/rss-watchlist-response.schema.ts";

import type { PlexSettings } from "../plex-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class PlexRSSAPI extends BaseDataSource<PlexSettings> {
  public override baseURL = "https://rss.plex.tv";

  public override serviceName = "Plex [RSS]";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["accept"] = "application/json";
  }

  public async getRSSWatchlists() {
    const { rssUrls } = this.settings;

    if (!rssUrls || rssUrls.length === 0) {
      return [];
    }

    const responses = await Promise.all(
      rssUrls.map(async (rssUrl) =>
        this.get<unknown>(new URL(rssUrl).pathname),
      ),
    );

    return responses.flatMap(
      (response) => RSSWatchlistResponse.parse(response).items,
    );
  }

  // Nothing to validate here; the main PlexAPI datasource will catch config errors
  public override validate() {
    return true;
  }
}

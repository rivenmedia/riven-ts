import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";
import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import { UnrestrictedLink } from "@repo/util-plugin-sdk/schemas/torrents/unrestricted-link";

import { Store } from "../schemas/store.schema.ts";

import type { AddTorrentResponse } from "../schemas/add-torrent-response.schema.ts";
import type { CacheCheckResponse } from "../schemas/cache-check-response.schema.ts";
import type { StremThruSettings } from "../stremthru-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";
import type { MediaItemDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

export class StremThruAPIError extends Error {}

export class StremThruAPI extends BaseDataSource<StremThruSettings> {
  override baseURL = "https://stremthru.13377001.xyz/";
  override serviceName = "StremThru";

  protected override rateLimiterOptions?: RateLimiterOptions | undefined = {
    max: 1,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    const { data: store } = Store.safeParse(
      requestOpts.headers["x-stremthru-store-name"],
    );

    if (!store) {
      throw new Error("Store is required");
    }

    const apiKeySettingKey = `${store}ApiKey` as const;

    requestOpts.headers["x-stremthru-store-authorization"] =
      `Bearer ${this.settings[apiKeySettingKey]}`;
  }

  override async validate() {
    try {
      // Implement your own validation logic here
      await this.get("validate");

      return true;
    } catch {
      return false;
    }
  }

  async addTorrent(
    infoHash: string,
    store: Store,
  ): Promise<MediaItemDownloadRequestedResponse> {
    const { data } = await this.post<AddTorrentResponse>("v0/store/torz", {
      headers: {
        "x-stremthru-store-name": store,
      },
      body: JSON.stringify({
        link: `magnet:?xt=urn:btih:${infoHash}`.toLowerCase(),
      }),
    });

    return {
      torrentId: data.id,
      files: data.files,
    };
  }

  async getCachedTorrents(infoHashes: string[], store: Store) {
    const {
      data: { items },
    } = await this.get<CacheCheckResponse>("v0/store/torz/check", {
      headers: {
        "x-stremthru-store-name": store,
      },
      params: {
        hash: infoHashes.join(","),
      },
      cacheOptions: {
        ttl: 60 * 60 * 24,
      },
    });

    return items.reduce<Record<string, DebridFile[]>>((acc, item) => {
      if (item.status !== "cached") {
        return acc;
      }

      return {
        ...acc,
        [item.hash]: item.files,
      };
    }, {});
  }

  async generateLink(link: string, store: Store) {
    const response = await this.post<UnrestrictedLink>(
      "v0/store/torz/link/generate",
      {
        body: JSON.stringify({ link }),
        headers: {
          "x-stremthru-store-name": store,
        },
      },
    );

    return UnrestrictedLink.parse(response);
  }
}

export type StremThruContextSlice = BasePluginContext;

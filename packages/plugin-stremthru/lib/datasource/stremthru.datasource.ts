import {
  BaseDataSource,
  type BasePluginContext,
  type ParamsFor,
} from "@repo/util-plugin-sdk";
import {
  Episode,
  Season,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import { AddTorrentResponse } from "../schemas/add-torrent-response.schema.js";
import { CacheCheckResponse } from "../schemas/cache-check-response.schema.js";
import { DeleteTorrentResponse } from "../schemas/delete-torrent-response.schema.ts";
import { GenerateLinkResponse } from "../schemas/generate-link-response.schema.js";
import { ItemStatus } from "../schemas/item-status.schema.js";
import { Store } from "../schemas/store.schema.ts";
import { TorznabResponse } from "../schemas/torznab-response.schema.ts";

import type { StremThruSettings } from "../stremthru-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type {
  RequestOptions,
  ValueOrPromise,
} from "@apollo/datasource-rest/dist/RESTDataSource.js";
import type { MediaItemDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";
import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

const storeNameHeader = "x-stremthru-store-name";

export class StremThruAPIError extends Error {}

export class StremThruAPI extends BaseDataSource<StremThruSettings> {
  override baseURL = this.settings.stremThruUrl;
  override serviceName = "StremThru";

  #buildCommonHeaders(store: Store) {
    return {
      [storeNameHeader]: store,
    };
  }

  protected override willSendRequest(
    path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    if (path.startsWith("v0/torznab")) {
      return;
    }

    const { data: store } = Store.safeParse(
      requestOpts.headers[storeNameHeader],
    );

    if (!store) {
      throw new Error("Store is required");
    }

    const apiKeySettingKey = `${store}ApiKey` as const;
    const apiKey = this.settings[apiKeySettingKey];

    if (!apiKey) {
      throw new Error(`Missing API key for ${store}`);
    }

    requestOpts.headers["x-stremthru-store-authorization"] = `Bearer ${apiKey}`;
  }

  protected override cacheKeyFor(url: URL, request: RequestOptions): string {
    const baseKey = super.cacheKeyFor(url, request);
    const store = request.headers?.[storeNameHeader];

    if (!store) {
      return baseKey;
    }

    return `${baseKey}:${store}`;
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
    const response = await this.post<unknown>("v0/store/torz", {
      headers: this.#buildCommonHeaders(store),
      body: JSON.stringify({
        link: `magnet:?xt=urn:btih:${infoHash}`.toLowerCase(),
      }),
    });

    const { data } = AddTorrentResponse.parse(response);

    if (!data) {
      throw new StremThruAPIError(`No data returned from ${store}`);
    }

    if (data.status !== "downloaded") {
      await this.removeTorrent(data.id, store);

      throw new StremThruAPIError(
        `${infoHash} was in the ${data.status} state on ${store}; the torrent will not be downloaded.`,
      );
    }

    return {
      torrentId: data.id,
      files: data.files,
    };
  }

  async removeTorrent(id: string, store: Store) {
    const response = await this.delete<unknown>(`v0/store/torz/${id}`, {
      headers: this.#buildCommonHeaders(store),
    });

    return DeleteTorrentResponse.parse(response).data;
  }

  async getCachedTorrents(infoHashes: string[], store: Store) {
    const response = await this.get<unknown>("v0/store/torz/check", {
      headers: this.#buildCommonHeaders(store),
      params: {
        hash: infoHashes.join(","),
      },
      cacheOptions: {
        ttl: 60 * 60 * 24,
      },
    });

    const {
      data: { items },
    } = CacheCheckResponse.parse(response);

    const allowedStatuses = ItemStatus.extract(["cached"]);

    return items.reduce<Record<string, DebridFile[]>>((acc, item) => {
      if (!allowedStatuses.safeParse(item.status).success) {
        return acc;
      }

      return {
        ...acc,
        [item.hash]: item.files,
      };
    }, {});
  }

  async generateLink(link: string, store: Store) {
    const response = await this.post<unknown>("v0/store/torz/link/generate", {
      body: JSON.stringify({ link }),
      headers: this.#buildCommonHeaders(store),
    });

    const { data } = GenerateLinkResponse.parse(response);

    return data;
  }

  async scrape({
    item,
  }: ParamsFor<MediaItemScrapeRequestedEvent>): Promise<
    Record<string, string>
  > {
    try {
      const params = new URLSearchParams({
        o: "json",
      });

      if (item.imdbId) {
        params.set("imdbid", item.imdbId);
      } else {
        params.set("q", item.title);
      }

      if (item instanceof ShowLikeMediaItem) {
        params.set("t", "tvsearch");
        params.set("cat", "5000");
      } else {
        params.set("t", "movie");
        params.set("cat", "2000");
      }

      if (item instanceof Season) {
        params.set("season", item.number.toString());
      }

      if (item instanceof Episode) {
        const seasonNumber = await item.season.loadProperty("number");

        params.set("season", seasonNumber.toString());
        params.set("ep", item.number.toString());
      }

      const response = await this.get<unknown>("v0/torznab/api", { params });

      const parsed = TorznabResponse.safeParse(response);

      if (!parsed.success) {
        this.logger.warn(
          `Invalid torznab response for ${item.fullTitle} (IMDB: ${item.imdbId ?? "N/A"})`,
        );

        return {};
      }

      const torrents: Record<string, string> = {};

      for (const torznabItem of parsed.data.channel.items) {
        const infoHashAttr = torznabItem.attr.find(
          (a) => a["@attributes"].name === "infohash",
        );

        const infoHash = infoHashAttr?.["@attributes"].value;

        if (!infoHash || !torznabItem.title) {
          continue;
        }

        torrents[infoHash] = torznabItem.title;
      }

      this.logger.info(
        `Found ${Object.keys(torrents).length.toString()} torrents for ${item.fullTitle} (IMDB: ${item.imdbId ?? "N/A"})`,
      );

      return torrents;
    } catch (error: unknown) {
      this.logger.error(error);

      return {};
    }
  }
}

export type StremThruContextSlice = BasePluginContext;

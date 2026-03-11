import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";
import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import { UnrestrictedLink } from "@repo/util-plugin-sdk/schemas/torrents/unrestricted-link";

import { StremThru } from "stremthru";

import { RealDebridError } from "../schemas/realdebrid-error.schema.ts";

import type { RealDebridSettings } from "../realdebrid-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type {
  DataSourceFetchResult,
  RequestOptions,
  ValueOrPromise,
} from "@apollo/datasource-rest/dist/RESTDataSource.js";
import type { MediaItemDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

export class RealDebridAPIError extends Error {}

export class RealDebridAPI extends BaseDataSource<RealDebridSettings> {
  override baseURL = "https://api.real-debrid.com/rest/1.0/";
  override serviceName = "RealDebrid";

  protected override rateLimiterOptions?: RateLimiterOptions | undefined = {
    max: 250 / 60,
    duration: 1000,
  };

  protected stremThruClient = new StremThru({
    baseUrl: "https://stremthru.13377001.xyz/",
    auth: {
      store: "realdebrid",
      token: this.settings.apiKey,
    },
  });

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["authorization"] = `Bearer ${this.settings.apiKey}`;
  }

  override async throwIfResponseIsError(options: {
    url: URL;
    request: RequestOptions;
    response: DataSourceFetchResult<unknown>["response"];
    parsedBody: unknown;
  }): Promise<void> {
    await super.throwIfResponseIsError(options);

    const realDebridError = RealDebridError.safeParse(options.parsedBody);

    if (realDebridError.success) {
      throw new RealDebridAPIError(
        `${realDebridError.data.error} - ${realDebridError.data.error_details} [code: ${realDebridError.data.error_code.toString()}]`,
      );
    }
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
  ): Promise<MediaItemDownloadRequestedResponse> {
    const { data } = await this.stremThruClient.store.torz.add({
      link: `magnet:?xt=urn:btih:${infoHash}`.toLowerCase(),
    });

    if (!data.id) {
      throw new RealDebridAPIError("Failed to add torrent to RealDebrid.");
    }

    return {
      torrentId: data.id,
      files: data.files,
    };
  }

  async getCachedTorrents(infoHashes: string[]) {
    const {
      data: { items },
    } = await this.stremThruClient.store.torz.check({
      hash: infoHashes,
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

  // async getInstantAvailability(
  //   infoHash: string,
  // ): Promise<MediaItemDownloadRequestedResponse> {
  //   const torrentId = await this.#addTorrent(infoHash, 123);

  //   try {
  //     return await this.#processTorrent(torrentId, infoHash);
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       this.logger.warn(
  //         `Failed to process RealDebrid torrent ${torrentId}: ${error.message}. Attempting to delete torrent.`,
  //       );
  //     }

  //     try {
  //       await this.#deleteTorrent(torrentId);
  //     } catch (deletionError) {
  //       this.logger.debug(
  //         `Failed to delete RealDebrid torrent ${torrentId} after processing error: ${
  //           deletionError instanceof Error
  //             ? deletionError.message
  //             : String(deletionError)
  //         }`,
  //       );
  //     }

  //     throw new RealDebridAPIError(
  //       `Failed to process torrent: ${
  //         error instanceof Error ? error.message : String(error)
  //       }`,
  //     );
  //   }
  // }

  async unrestrictLink(link: string) {
    const body = new URLSearchParams({
      link,
    });

    const response = await this.post<UnrestrictedLink>("unrestrict/link", {
      body,
    });

    return UnrestrictedLink.parse(response);
  }
}

export type RealDebridContextSlice = BasePluginContext;

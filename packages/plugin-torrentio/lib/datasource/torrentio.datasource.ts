import {
  BaseDataSource,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk/datasource";
import { getStremioScrapeConfig } from "@repo/util-plugin-sdk/helpers/get-stremio-scrape-config";
import { z } from "@repo/util-plugin-sdk/validation";

import type { TorrentioSettings } from "../torrentio-settings.schema.ts";
import type { BasePluginContext } from "@repo/util-plugin-sdk/schemas";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";
import type { ParamsFor } from "@repo/util-plugin-sdk/types/events";

const TorrentioScrapeResponse = z.object({
  streams: z.array(
    z.object({
      title: z.string(),
      infoHash: z.hash("sha1"),
    }),
  ),
});

export class TorrentioAPIError extends Error {}

export class TorrentioAPI extends BaseDataSource<TorrentioSettings> {
  override baseURL = "http://torrentio.strem.fun/";
  override serviceName = "Torrent.io";

  get #filter() {
    return this.settings.filter;
  }

  protected override rateLimiterOptions: RateLimiterOptions = {
    max: 150,
    duration: 60 * 1000,
  };

  override async validate() {
    try {
      // Implement your own validation logic here
      await this.get("validate");

      return true;
    } catch {
      return false;
    }
  }

  async scrape({
    item,
  }: ParamsFor<MediaItemScrapeRequestedEvent>): Promise<
    Record<string, string>
  > {
    try {
      if (!item.imdbId) {
        throw new Error("IMDB ID is required for Torrentio scraping");
      }

      const { identifier, imdbId, scrapeType } =
        await getStremioScrapeConfig(item);

      const response = await this.get<unknown>(
        `${this.#filter}/stream/${scrapeType}/${imdbId}${identifier ?? ""}.json`,
      );

      const parsed = TorrentioScrapeResponse.parse(response);

      if (!parsed.streams.length) {
        this.logger.info(
          `No streams found for item ${item.fullTitle} (IMDB: ${item.imdbId})`,
        );

        return {};
      }

      const torrents: Record<string, string> = {};

      for (const stream of parsed.streams) {
        if (!stream.infoHash) {
          continue;
        }

        const [streamTitle = ""] = stream.title.split("\n👤");
        const [rawTitle = ""] = streamTitle.split("\n");

        if (!rawTitle) {
          continue;
        }

        torrents[stream.infoHash] = rawTitle;
      }

      const torrentsCount = Object.keys(torrents).length;

      if (torrentsCount > 0) {
        this.logger.info(
          `Found ${torrentsCount.toString()} torrents from ${this.serviceName} for ${item.fullTitle} (IMDB: ${item.imdbId})`,
        );
      } else {
        this.logger.info(
          `No torrents found from ${this.serviceName} for ${item.fullTitle} (IMDB: ${item.imdbId})`,
        );
      }

      return torrents;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to scrape ${item.fullTitle} (IMDB: ${item.imdbId ?? "N/A"})`,
        { err: error },
      );

      return {};
    }
  }
}

export type TorrentioContextSlice = BasePluginContext;

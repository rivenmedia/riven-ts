import {
  BaseDataSource,
  type BasePluginContext,
  type ParamsFor,
  type RateLimiterOptions,
  getStremioScrapeConfig,
} from "@repo/util-plugin-sdk";
import { z } from "@repo/util-plugin-sdk/validation";

import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

const TorrentioScrapeResponse = z.object({
  streams: z.array(
    z.object({
      title: z.string(),
      infoHash: z.string(),
    }),
  ),
});

export class TorrentioAPIError extends Error {}

export class TorrentioAPI extends BaseDataSource {
  override baseURL = "http://torrentio.strem.fun/";
  override serviceName = "Torrent.io";

  #filter = "sort=qualitysize%7Cqualityfilter=threed,480p,scr,cam";

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

      const { identifier, imdbId, scrapeType } = getStremioScrapeConfig(item);

      const response = await this.get<unknown>(
        `${this.#filter}/stream/${scrapeType}/${imdbId}${identifier ?? ""}.json`,
      );

      const parsed = TorrentioScrapeResponse.parse(response);

      if (!parsed.streams.length) {
        this.logger.info(
          `No streams found for item ${item.title ?? "Unknown"} (IMDB: ${item.imdbId})`,
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

      if (torrentsCount >= 0) {
        this.logger.info(
          `Found ${torrentsCount.toString()} torrents for ${item.title ?? "Unknown"} (IMDB: ${item.imdbId})`,
        );
      } else {
        this.logger.info(
          `No torrents found for ${item.title ?? "Unknown"} (IMDB: ${item.imdbId})`,
        );
      }

      return torrents;
    } catch (error: unknown) {
      this.logger.error(error);

      return {};
    }
  }
}

export type TorrentioContextSlice = BasePluginContext;

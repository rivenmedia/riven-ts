import {
  BaseDataSource,
  type ParamsFor,
  type RateLimiterOptions,
  getStremioScrapeConfig,
} from "@repo/util-plugin-sdk";
import { z } from "@repo/util-plugin-sdk/validation";

import { parseTorrentioStreamStats } from "./parse-torrentio-stream-stats.ts";

import type { TorrentioSettings } from "../torrentio-settings.schema.ts";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

const TorrentioScrapeResponse = z.object({
  streams: z.array(
    z.object({
      title: z.string(),
      infoHash: z.hash("sha1"),
    }),
  ),
});

/**
 * Richer per-stream representation captured directly from the Torrentio
 * response. Surfaces the indexer-reported size / seeder counts so they can
 * be persisted on the `Stream` entity by downstream consumers.
 */
export interface TorrentioScrapedStream {
  rawTitle: string;
  /** Size in bytes, when Torrentio surfaces a parseable `💾 <value>` token. */
  size: number | null;
  /** Seeder count, when Torrentio surfaces a `👤 <value>` token. */
  seeders: number | null;
}

class TorrentioAPIError extends Error {}

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

  /**
   * Scrape Torrentio for streams matching the given media item.
   *
   * Returns a richer per-infoHash record that includes the indexer-reported
   * size / seeder counts (when present in the response). Leechers are
   * intentionally NOT captured: Torrentio's Stremio addon response embeds
   * stats as `👤 <seeders> 💾 <size> ⚙️ <tracker>` and does not surface
   * leecher counts in any documented form.
   */
  async scrape({
    item,
  }: ParamsFor<MediaItemScrapeRequestedEvent>): Promise<
    Record<string, TorrentioScrapedStream>
  > {
    try {
      if (!item.imdbId) {
        throw new TorrentioAPIError(
          "IMDB ID is required for Torrentio scraping",
        );
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

      const torrents: Record<string, TorrentioScrapedStream> = {};

      for (const stream of parsed.streams) {
        if (!stream.infoHash) {
          continue;
        }

        const [streamTitle = ""] = stream.title.split("\n👤");
        const [rawTitle = ""] = streamTitle.split("\n");

        if (!rawTitle) {
          continue;
        }

        const { size, seeders } = parseTorrentioStreamStats(stream.title);

        torrents[stream.infoHash] = {
          rawTitle,
          size,
          seeders,
        };
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

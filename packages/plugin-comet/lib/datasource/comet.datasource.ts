import {
  BaseDataSource,
  type ParamsFor,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";
import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { CometSettings } from "../comet-settings.schema.ts";
import { CometScrapeResponse } from "../schemas/scrape-response.schema.ts";
import { parseCometStreamStats } from "./parse-comet-stream-stats.ts";

import type { CometRegularSearchResult } from "../schemas/scrape-response.schema.ts";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

interface CometScrapeConfig {
  identifier: string | null;
  scrapeType: "series" | "movie";
  imdbId: string;
}

/**
 * Richer per-stream representation captured directly from the Comet
 * response. Surfaces the indexer-reported size / seeder counts so they can
 * be persisted on the `Stream` entity by downstream consumers.
 */
export interface CometScrapedStream {
  rawTitle: string;
  /**
   * Size in bytes, prefer `behaviorHints.videoSize` (when Comet emits it) and
   * fall back to a parsed `💾 <value>` token in the description.
   */
  size: number | null;
  /** Seeder count, parsed from `👤 <value>` in the description if present. */
  seeders: number | null;
}

class CometAPIError extends Error {}

export class CometAPI extends BaseDataSource<CometSettings> {
  override baseURL = this.settings.url;
  override serviceName = "Comet";

  override async validate() {
    try {
      // Implement your own validation logic here
      await this.get("validate");

      return true;
    } catch {
      return false;
    }
  }

  protected override rateLimiterOptions: RateLimiterOptions = {
    max: 150,
    duration: 60 * 1000,
  };

  /**
   * Scrape Comet for streams matching the given media item.
   *
   * Returns a richer per-infoHash record that includes the indexer-reported
   * size and seeder counts (when parseable from Comet's `description`).
   * Leechers are intentionally NOT captured: Comet's Stremio addon response
   * does not surface leecher counts in any documented form.
   */
  async scrape({
    item,
  }: ParamsFor<MediaItemScrapeRequestedEvent>): Promise<
    Record<string, CometScrapedStream>
  > {
    try {
      if (!item.imdbId) {
        throw new CometAPIError("IMDB ID is required for Comet scraping");
      }

      const { identifier, imdbId, scrapeType } =
        await this.#getCometScrapeConfig(item);

      const response = await this.get<unknown>(
        `/stream/${scrapeType}/${imdbId}${identifier ?? ""}.json`,
      );

      const parsed = CometScrapeResponse.parse(response);

      if (!parsed.streams.length) {
        this.logger.info(
          `No streams found for item ${item.fullTitle} (IMDB: ${item.imdbId})`,
        );

        return {};
      }

      const torrents: Record<string, CometScrapedStream> = {};

      for (const stream of parsed.streams) {
        if ("url" in stream) {
          // Skip the "[🔄] Comet" stream which is not an actual torrent result
          continue;
        }

        if (!stream.infoHash) {
          continue;
        }

        const title =
          stream.behaviorHints.filename ??
          // Comet prefixes description lines with emoji (e.g., "<emoji> Title"), strip it
          stream.description.split("\n")[0]?.substring(1).trim();

        if (!title) {
          continue;
        }

        torrents[stream.infoHash] = {
          rawTitle: title,
          ...this.#captureStreamStats(stream),
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

  /**
   * Extract size / seeder counts for a single Comet stream.
   *
   * Prefers the structured `behaviorHints.videoSize` field (when Comet emits
   * it) for `size`; falls back to parsing emoji-prefixed tokens out of the
   * free-form description for both `size` and `seeders`.
   */
  #captureStreamStats(stream: CometRegularSearchResult): {
    size: number | null;
    seeders: number | null;
  } {
    const fromDescription = parseCometStreamStats(stream.description);

    return {
      size: stream.behaviorHints.videoSize ?? fromDescription.size,
      seeders: fromDescription.seeders,
    };
  }

  /**
   * Gets the Comet scrape config for a given media item.
   *
   * @param item The media item to get the Comet scraper config for
   * @returns The Comet scrape config
   */
  async #getCometScrapeConfig(item: MediaItem): Promise<CometScrapeConfig> {
    if (!item.imdbId) {
      throw new CometAPIError("IMDB ID is required for Comet scrape config");
    }

    if (item instanceof Show) {
      return {
        identifier: null,
        imdbId: item.imdbId,
        scrapeType: "series",
      };
    }

    if (item instanceof Season) {
      return {
        identifier: `:${item.number.toString()}`,
        imdbId: item.imdbId,
        scrapeType: "series",
      };
    }

    if (item instanceof Episode) {
      const seasonNumber = await item.season.loadProperty("number");

      return {
        identifier: `:${seasonNumber.toString()}:${item.number.toString()}`,
        imdbId: item.imdbId,
        scrapeType: "series",
      };
    }

    if (item instanceof Movie) {
      return {
        identifier: null,
        imdbId: item.imdbId,
        scrapeType: "movie",
      };
    }

    throw new CometAPIError("Unsupported media item type for Comet identifier");
  }
}

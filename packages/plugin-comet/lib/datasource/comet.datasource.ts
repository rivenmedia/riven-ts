import {
  BaseDataSource,
  type BasePluginContext,
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

import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

interface CometScrapeConfig {
  identifier: string | null;
  scrapeType: "series" | "movie";
  imdbId: string;
}

export class CometAPIError extends Error {}

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

  async scrape({
    item,
  }: ParamsFor<MediaItemScrapeRequestedEvent>): Promise<
    Record<string, string>
  > {
    try {
      if (!item.imdbId) {
        throw new Error("IMDB ID is required for Comet scraping");
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

      const torrents: Record<string, string> = {};

      for (const stream of parsed.streams) {
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

        torrents[stream.infoHash] = title;
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
   * Gets the Comet scrape config for a given media item.
   *
   * @param item The media item to get the Comet scraper config for
   * @returns The Comet scrape config
   */
  async #getCometScrapeConfig(item: MediaItem): Promise<CometScrapeConfig> {
    if (!item.imdbId) {
      throw new Error("IMDB ID is required for Comet scrape config");
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

    throw new Error("Unsupported media item type for Comet identifier");
  }
}

export type CometContextSlice = BasePluginContext;

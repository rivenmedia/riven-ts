import {
  BaseDataSource,
  type BasePluginContext,
  type ParamsFor,
  type RateLimiterOptions,
  getStremioScrapeConfig,
} from "@repo/util-plugin-sdk";
import { z } from "@repo/util-plugin-sdk/validation";

import { CometSettings } from "../comet-settings.schema.ts";

import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

const CometScrapeResponse = z.object({
  streams: z.array(
    z.object({
      description: z.string(),
      infoHash: z.hash("sha1"),
      behaviorHints: z.object({
        filename: z.string().optional(),
      }),
    }),
  ),
});

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
        await getStremioScrapeConfig(item);

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
        `Failed to scrape ${item.fullTitle} (IMDB: ${item.imdbId ?? "N/A"}):`,
        error,
      );

      return {};
    }
  }
}

export type CometContextSlice = BasePluginContext;

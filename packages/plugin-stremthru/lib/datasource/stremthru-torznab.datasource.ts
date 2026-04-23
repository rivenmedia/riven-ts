import {
  BaseDataSource,
  type BasePluginContext,
  type ParamsFor,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";
import {
  Episode,
  Season,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import { TorznabResponse } from "../schemas/torznab-response.schema.ts";

import type { StremThruSettings } from "../stremthru-settings.schema.ts";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

export class StremThruAPIError extends Error {}

export class StremThruTorznabAPI extends BaseDataSource<StremThruSettings> {
  override baseURL = this.settings.stremThruUrl;
  override serviceName = "StremThru [Torznab]";

  protected override rateLimiterOptions: RateLimiterOptions = {
    max: 150,
    duration: 60 * 1000,
  };

  override async validate(): Promise<boolean> {
    try {
      // Implement your own validation logic here
      await this.get("v0/torznab/api");

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
        `Found ${Object.keys(torrents).length.toString()} torrents from ${this.serviceName} for ${item.fullTitle} (IMDB: ${item.imdbId ?? "N/A"})`,
      );

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

export type StremThruContextSlice = BasePluginContext;

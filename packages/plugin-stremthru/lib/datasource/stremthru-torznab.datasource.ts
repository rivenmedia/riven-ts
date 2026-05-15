import {
  BaseDataSource,
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

/**
 * Richer per-stream representation captured directly from the Torznab
 * response. Surfaces the indexer-reported size / seeder / leecher counts so
 * they can be persisted on the `Stream` entity by downstream consumers.
 *
 * Unlike Torrentio / Comet (which surface a single `seeders` token), the
 * Torznab spec carries `size`, `seeders`, AND `peers` (total swarm) per
 * stream. Leecher count is derived as `max(peers - seeders, 0)` when both
 * are present; otherwise it is left `null`.
 */
export interface StremThruScrapedStream {
  rawTitle: string;
  size: number | null;
  seeders: number | null;
  leechers: number | null;
}

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

  /**
   * Scrape a configured Torznab indexer (via StremThru) for streams matching
   * the given media item.
   *
   * Returns a richer per-infoHash record that includes the indexer-reported
   * size / seeder / leecher counts. Leechers are derived as
   * `max(peers - seeders, 0)` when both fields are present, mirroring the
   * Torznab spec definition of `peers` as total swarm size.
   */
  async scrape({
    item,
  }: ParamsFor<MediaItemScrapeRequestedEvent>): Promise<
    Record<string, StremThruScrapedStream>
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

      const torrents: Record<string, StremThruScrapedStream> = {};

      for (const torznabItem of parsed.data.channel.items) {
        const attrs = this.#buildAttrLookup(torznabItem.attr);
        const infoHash = attrs.get("infohash");

        if (!infoHash || !torznabItem.title) {
          continue;
        }

        const size =
          this.#parseNonNegativeInt(attrs.get("size")) ??
          torznabItem.size ??
          null;

        const seeders = this.#parseNonNegativeInt(attrs.get("seeders"));
        const peers = this.#parseNonNegativeInt(attrs.get("peers"));

        const leechers =
          peers !== null && seeders !== null
            ? Math.max(peers - seeders, 0)
            : null;

        torrents[infoHash] = {
          rawTitle: torznabItem.title,
          size,
          seeders,
          leechers,
        };
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

  /**
   * Flatten the Torznab `<attr>` array into a case-insensitive map. The first
   * occurrence of each attribute name wins, matching how most consumers
   * (Sonarr / Radarr / Prowlarr) treat duplicates.
   */
  #buildAttrLookup(
    attrs: readonly { "@attributes": { name: string; value: string } }[],
  ): Map<string, string> {
    const lookup = new Map<string, string>();

    for (const attr of attrs) {
      const key = attr["@attributes"].name.toLowerCase();

      if (!lookup.has(key)) {
        lookup.set(key, attr["@attributes"].value);
      }
    }

    return lookup;
  }

  #parseNonNegativeInt(value: string | undefined): number | null {
    if (value === undefined) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  }
}

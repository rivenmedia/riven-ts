import {
  BaseDataSource,
  type ParamsFor,
  getMinimalStremioScrapeConfig,
} from "@repo/util-plugin-sdk";

import { MeteorSettings } from "../meteor-settings.schema.ts";
import { MeteorScrapeResponse } from "../schemas/scrape-response.schema.ts";

import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

export class MeteorAPIError extends Error {}

export class MeteorAPI extends BaseDataSource<MeteorSettings> {
  override baseURL = this.settings.url;
  override serviceName = "Meteor";

  override async validate() {
    try {
      await this.get("manifest.json");

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
        throw new MeteorAPIError("IMDB ID is required for Meteor scraping");
      }

      const { identifier, imdbId, scrapeType } =
        await getMinimalStremioScrapeConfig(item);

      const response = await this.get<unknown>(
        `/stream/${scrapeType}/${imdbId}${identifier ?? ""}.json`,
      );

      const parsed = MeteorScrapeResponse.parse(response);

      const torrents: Record<string, string> = {};

      for (const stream of parsed.streams) {
        if (!stream.infoHash) {
          continue;
        }

        const title = this.#extractTitle(
          stream.description,
          stream.behaviorHints.filename,
        );

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
   * Extracts the torrent title from the description field.
   * Both stable and testing versions prefix the first line with an emoji (📁 or 📄).
   * Falls back to `behaviorHints.filename` if the description title is truncated.
   */
  #extractTitle(description: string, filename?: string): string | undefined {
    const firstLine = description.split("\n")[0];
    if (!firstLine) {
      return filename;
    }

    // Strip the leading emoji + space (e.g. "📁 " or "📄 ")
    const title = firstLine.replace(/^\p{Emoji_Presentation}\s*/u, "").trim();

    if (!title) {
      return filename;
    }

    // Stable version truncates with "...", fall back to filename
    if (title.endsWith("...") && filename) {
      return filename;
    }

    return title;
  }
}

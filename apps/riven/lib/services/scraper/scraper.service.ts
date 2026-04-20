import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import {
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { BaseService } from "../base-service.ts";
import { persistScrapeResults } from "./utilities/persist-scrape-results.ts";

import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { ParsedData } from "@repo/util-rank-torrent-name";
import type { UUID } from "node:crypto";

export class ScraperService extends BaseService {
  #updateScrapeMetadata(item: MediaItem, success: boolean) {
    item.scrapedAt = DateTime.now().toJSDate();
    item.scrapedTimes++;

    if (success) {
      item.failedAttempts = 0;
    } else {
      item.failedAttempts++;
    }
  }

  @EnsureRequestContext()
  @Transactional()
  async scrapeItem(id: UUID, results: Record<string, ParsedData>) {
    const existingItem = await this.em
      .getRepository(MediaItem)
      .findOneOrFail(id, { populate: ["streams.infoHash"] });

    try {
      if (Object.keys(results).length === 0) {
        throw new MediaItemScrapeErrorNoNewStreams({
          item: existingItem,
          error: new Error(
            `No streams returned from scrapers for ${chalk.bold(existingItem.fullTitle)}`,
          ),
        });
      }

      const processableStates = MediaItemState.extract([
        "indexed",
        "ongoing",
        "scraped",
        "partially_completed",
      ]);

      assert(
        processableStates.safeParse(existingItem.state).success,
        new MediaItemScrapeErrorIncorrectState({
          item: existingItem,
        }),
      );

      const newStreamsCount = await persistScrapeResults(
        this.em,
        existingItem,
        results,
      );

      if (newStreamsCount === 0) {
        throw new MediaItemScrapeErrorNoNewStreams({
          item: existingItem,
          error: new Error(
            `No new streams added for ${chalk.bold(existingItem.fullTitle)}`,
          ),
        });
      }

      const { logger } = await import("../../utilities/logger/logger.ts");

      logger.info(
        `Added ${newStreamsCount.toString()} new streams to ${chalk.bold(existingItem.fullTitle)}`,
      );

      this.#updateScrapeMetadata(existingItem, true);

      return {
        item: existingItem,
        newStreamsCount,
      };
    } catch (error) {
      if (error instanceof MediaItemScrapeErrorNoNewStreams) {
        // We only want to consider an attempt as failed if no new streams were added
        // instead of on *any* error (e.g. a database error) that occurs during the persist process.
        this.#updateScrapeMetadata(error.payload.item, false);

        return {
          item: error.payload.item,
          newStreamsCount: 0,
        };
      }

      throw error;
    }
  }

  @EnsureRequestContext()
  async getItemToScrape(mediaItemId: UUID, mediaItemType: MediaItemType) {
    return this.em.getRepository(MediaItem).findOneOrFail({
      id: mediaItemId,
      state: {
        $in: ["indexed", "ongoing", "scraped", "partially_completed"],
      },
      type: mediaItemType,
      isRequested: true,
    });
  }
}

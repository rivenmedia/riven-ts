import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import { ValidationError } from "@mikro-orm/core";
import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { BaseService } from "../core/base-service.ts";
import { persistScrapeResults } from "./utilities/persist-scrape-results.ts";

import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { ParsedData } from "@repo/util-rank-torrent-name";
import type { UUID } from "node:crypto";

export class ScraperService extends BaseService {
  @CreateRequestContext()
  async getItemToScrape(id: UUID, type: MediaItemType) {
    const item = await this.em.getRepository(MediaItem).findOneOrFail({
      id,
      type,
      isRequested: true,
    });

    const processableStates: MediaItemState[] = [
      "indexed",
      "ongoing",
      "scraped",
      "partially_completed",
    ];

    if (!processableStates.includes(item.state)) {
      throw new ValidationError(
        `${chalk.bold(item.fullTitle)} is ${chalk.bold(item.state)} and cannot be scraped`,
        item,
      );
    }

    return item;
  }

  #updateScrapeMetadata(item: MediaItem, newFailedScrapeAttempts: number) {
    item.scrapedAt = DateTime.utc().toJSDate();
    item.scrapedTimes++;
    item.failedScrapeAttempts = newFailedScrapeAttempts;
  }

  @CreateRequestContext()
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

      const { logger } = await import("../../../utilities/logger/logger.ts");

      logger.info(
        `Added ${newStreamsCount.toString()} new streams to ${chalk.bold(existingItem.fullTitle)}`,
      );

      this.#updateScrapeMetadata(existingItem, 0);

      return {
        item: existingItem,
        newStreamsCount,
      };
    } catch (error) {
      if (error instanceof MediaItemScrapeErrorNoNewStreams) {
        // We only want to consider an attempt as failed if scraping succeeded and no new streams were added
        // instead of on *any* error (e.g. a database error) that occurs during the persist process.
        this.#updateScrapeMetadata(
          error.payload.item,
          error.payload.item.failedScrapeAttempts + 1,
        );

        return {
          item: error.payload.item,
          newStreamsCount: 0,
        };
      }

      throw error;
    }
  }
}

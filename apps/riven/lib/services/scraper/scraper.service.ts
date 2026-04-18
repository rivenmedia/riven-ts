import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import { Transactional } from "@mikro-orm/decorators/legacy";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { BaseService } from "../base-service.ts";
import { persistScrapeResults } from "./utilities/persist-scrape-results.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";
import type { UUID } from "node:crypto";

export class ScraperService extends BaseService {
  @Transactional()
  async scrapeItem(id: UUID, results: Record<string, ParsedData>) {
    const existingItem = await this.em
      .getRepository(MediaItem)
      .findOneOrFail(id, { populate: ["streams.infoHash"] });

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

    try {
      const newStreamsCount = await persistScrapeResults(
        this.em,
        existingItem,
        results,
      );

      existingItem.failedAttempts = 0;

      const { logger } = await import("../../utilities/logger/logger.ts");

      logger.info(
        `Added ${newStreamsCount.toString()} new streams to ${chalk.bold(existingItem.fullTitle)}`,
      );

      return {
        item: existingItem,
        newStreamsCount,
      };
    } catch (error) {
      if (error instanceof MediaItemScrapeErrorNoNewStreams) {
        // We only want to consider an attempt as failed if no new streams were added
        // instead of on *any* error (e.g. a database error) that occurs during the persist process.
        existingItem.failedAttempts++;
      }

      return {
        item: existingItem,
        newStreamsCount: 0,
      };
    } finally {
      existingItem.scrapedAt = DateTime.now().toJSDate();
      existingItem.scrapedTimes++;
    }
  }
}

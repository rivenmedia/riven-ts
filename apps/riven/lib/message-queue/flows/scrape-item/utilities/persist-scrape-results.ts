import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import { ref } from "@mikro-orm/core";
import chalk from "chalk";
import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import assert from "node:assert";
import z from "zod";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export interface PersistScrapeResultsInput {
  id: number;
  results: Record<string, ParsedData>;
}

export async function persistScrapeResults({
  id,
  results,
}: PersistScrapeResultsInput) {
  const { existingItem, newStreamsCount } = await database.em
    .fork()
    .transactional(async (transaction) => {
      const existingItem = await transaction
        .getRepository(MediaItem)
        .findOneOrFail({ id }, { populate: ["streams.infoHash"] });

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

      const streamsCount = existingItem.streams.count();

      const infoHashes = Object.keys(results);
      const preScrapedStreams = await transaction.getRepository(Stream).find({
        infoHash: { $in: infoHashes },
      });

      const preScrapedStreamsMap = new Map(
        preScrapedStreams.map((stream) => [stream.infoHash, stream]),
      );

      for (const [infoHash, parsedData] of Object.entries(results)) {
        const existingEntry = preScrapedStreamsMap.get(infoHash);
        const stream =
          existingEntry ?? transaction.create(Stream, { infoHash, parsedData });

        existingItem.streams.add(ref(stream));
      }

      const newStreamsCount = existingItem.streams.count() - streamsCount;

      existingItem.failedAttempts =
        newStreamsCount === 0 ? existingItem.failedAttempts + 1 : 0;

      existingItem.scrapedAt = DateTime.now().toJSDate();
      existingItem.scrapedTimes++;

      try {
        await validateOrReject(existingItem);

        await transaction.persist(existingItem).flush();

        if (newStreamsCount > 0) {
          logger.info(
            `Added ${newStreamsCount.toString()} new streams to ${chalk.bold(existingItem.fullTitle)}`,
          );
        }
      } catch (error) {
        const errorMessage = z
          .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
          .transform((error) => {
            if (Array.isArray(error)) {
              return error
                .map((err) =>
                  err.constraints
                    ? Object.values(err.constraints).join("; ")
                    : "",
                )
                .join("; ");
            }

            return error.message;
          })
          .parse(error);

        throw new MediaItemScrapeError({
          item: existingItem,
          error: errorMessage,
        });
      }

      return {
        newStreamsCount,
        existingItem,
      };
    });

  if (newStreamsCount === 0) {
    throw new MediaItemScrapeErrorNoNewStreams({
      item: existingItem,
    });
  }

  return existingItem;
}

import { Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";

import { ref } from "@mikro-orm/core";
import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import assert from "node:assert";
import z from "zod";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";

import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { ParsedData } from "@repo/util-rank-torrent-name";

export interface PersistScrapeResultsInput {
  id: number;
  results: Record<string, ParsedData>;
}

export async function persistScrapeResults({
  id,
  results,
}: PersistScrapeResultsInput) {
  const existingItem = await database.mediaItem.findOneOrFail(
    { id },
    { populate: ["streams.infoHash"] },
  );

  const allowedStates: MediaItemState[] = ["indexed", "ongoing"];

  assert(
    allowedStates.includes(existingItem.state),
    new MediaItemScrapeErrorIncorrectState({
      item: existingItem,
    }),
  );

  const em = database.em.fork();
  const streamsCount = existingItem.streams.count();

  const infoHashes = Object.keys(results);
  const preScrapedStreams = await database.stream.find({
    infoHash: { $in: infoHashes },
  });

  const preScrapedStreamsMap = new Map(
    preScrapedStreams.map((stream) => [stream.infoHash, stream]),
  );

  for (const [infoHash, parsedData] of Object.entries(results)) {
    const existingEntry = preScrapedStreamsMap.get(infoHash);
    const stream = existingEntry ?? em.create(Stream, { infoHash, parsedData });

    existingItem.streams.add(ref(stream));
  }

  const newStreamsCount = existingItem.streams.count() - streamsCount;

  existingItem.failedAttempts =
    newStreamsCount === 0 ? existingItem.failedAttempts + 1 : 0;

  existingItem.scrapedAt = DateTime.now().toJSDate();
  existingItem.scrapedTimes++;

  try {
    await validateOrReject(existingItem);

    await em.persist(existingItem).flush();

    logger.info(
      newStreamsCount > 0
        ? `Added ${newStreamsCount.toString()} new streams to ${existingItem.fullTitle}`
        : `No new streams found for ${existingItem.fullTitle}`,
    );

    return existingItem;
  } catch (error) {
    const errorMessage = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .transform((error) => {
        if (Array.isArray(error)) {
          return error
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
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
}

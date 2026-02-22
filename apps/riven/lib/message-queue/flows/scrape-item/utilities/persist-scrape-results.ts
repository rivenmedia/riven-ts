import { Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";

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
  const existingItem = await database.mediaItem.findOneOrFail(
    { id },
    { populate: ["streams.infoHash"] },
  );

  assert(
    existingItem.state === "indexed",
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

  const preScrapedStreamsMap = preScrapedStreams.reduce<Record<string, Stream>>(
    (acc, stream) => ({ ...acc, [stream.infoHash]: stream }),
    {},
  );

  for (const [infoHash, parsedData] of Object.entries(results)) {
    const existingEntry = preScrapedStreamsMap[infoHash];
    const stream = existingEntry ?? em.create(Stream, { infoHash, parsedData });

    existingItem.streams.add(stream);
  }

  const newStreamsCount = existingItem.streams.count() - streamsCount;

  if (newStreamsCount === 0) {
    existingItem.failedAttempts++;
  }

  existingItem.state = "scraped";
  existingItem.scrapedAt = DateTime.now().toJSDate();
  existingItem.scrapedTimes++;

  try {
    await validateOrReject(existingItem);

    await em.flush();

    logger.info(
      newStreamsCount > 0
        ? `Added ${newStreamsCount.toString()} new streams to ${existingItem.title}`
        : `No new streams found for ${existingItem.title}`,
    );

    return existingItem;
  } catch (error) {
    console.error("Error validating or saving scraped results:", error);
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

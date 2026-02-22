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
    { populate: ["streams.infoHash", "blacklistedStreams:ref"] },
  );

  assert(
    existingItem.state === "indexed",
    new MediaItemScrapeErrorIncorrectState({
      item: existingItem,
    }),
  );

  const em = database.em.fork();
  const newStreams: Stream[] = [];

  for (const [infoHash, parsedData] of Object.entries(results)) {
    if (
      [...existingItem.streams, ...existingItem.blacklistedStreams].some(
        (s) => s.infoHash === infoHash,
      )
    ) {
      continue;
    }

    const stream = em.create(Stream, {
      infoHash,
      parsedData,
    });

    stream.parents.add(existingItem);

    newStreams.push(stream);
  }

  if (newStreams.length > 0) {
    logger.info(
      `Added ${newStreams.length.toString()} new streams to ${existingItem.title}`,
    );
  } else {
    logger.info(`No new streams found for ${existingItem.title}`);

    existingItem.failedAttempts++;
  }

  existingItem.state = "scraped";
  existingItem.scrapedAt = DateTime.now().toJSDate();
  existingItem.scrapedTimes++;
  existingItem.streams.add(newStreams);

  try {
    await validateOrReject(existingItem);

    await em.flush();

    return await em.refreshOrFail(existingItem);
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

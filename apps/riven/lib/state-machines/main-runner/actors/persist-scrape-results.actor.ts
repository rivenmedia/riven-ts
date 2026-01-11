import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities/index";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { DefaultParserResult } from "parse-torrent-title";

export interface PersistScrapeResultsInput {
  id: number;
  results: Record<string, DefaultParserResult>;
  sendEvent: MainRunnerMachineIntake;
}

export async function persistScrapeResults({
  id,
  results,
  sendEvent,
}: PersistScrapeResultsInput) {
  const existingItem = await database.manager.findOne(MediaItem, {
    where: {
      id,
    },
    relations: {
      streams: true,
      blacklistedStreams: true,
    },
  });

  if (!existingItem) {
    throw new Error(`Media item with ID ${id.toString()} not found`);
  }

  logger.warn({ existingItem, results, id });

  if (existingItem.state !== "Indexed") {
    sendEvent({
      type: "riven.media-item.scrape.already-exists",
      item: existingItem,
    });

    return;
  }

  let rank = 1;
  const newStreams = [];

  for (const [infoHash, parseResult] of Object.entries(results)) {
    if (
      [...existingItem.streams, ...existingItem.blacklistedStreams].some(
        (s) => s.infoHash === infoHash,
      )
    ) {
      continue;
    }

    const stream = new Stream();

    stream.infoHash = infoHash;
    stream.rawTitle = parseResult.title;
    stream.parsedTitle = parseResult.title;
    stream.rank = rank++;

    newStreams.push(stream);
  }

  const savedStreams = await database.manager.save(Stream, newStreams);

  existingItem.streams = [...existingItem.streams, ...savedStreams];

  if (savedStreams.length > 0) {
    logger.info(
      `Added ${savedStreams.length.toString()} new streams to ${existingItem.title ?? "Unknown"}: ${id.toString()}`,
    );
  } else {
    logger.info(
      `No new streams found for ${existingItem.title ?? "Unknown"}: ${id.toString()}`,
    );

    existingItem.failedAttempts++;
  }

  existingItem.state = "Scraped";
  existingItem.scrapedAt = new Date();
  existingItem.scrapedTimes++;

  try {
    await validateOrReject(existingItem);

    const updatedItem = await database.manager.save(MediaItem, existingItem);

    logger.info(
      `Scraped media item: ${existingItem.title ?? "Unknown"} (ID: ${id.toString()})`,
    );

    return updatedItem;
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    // sendEvent({
    //   type: "riven.media-item.scrape.error",
    //   item,
    //   error: Array.isArray(parsedError)
    //     ? parsedError
    //         .map((err) =>
    //           err.constraints ? Object.values(err.constraints).join("; ") : "",
    //         )
    //         .join("; ")
    //     : parsedError.message,
    // });

    throw error;
  }
}

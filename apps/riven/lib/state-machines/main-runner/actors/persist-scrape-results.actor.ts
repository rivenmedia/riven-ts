import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";
import { Stream } from "@repo/util-plugin-sdk/dto/entities/index";

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
  const existingItem = await database.mediaItem.findOneOrFail(
    { id },
    { populate: ["streams.infoHash", "blacklistedStreams:ref"] },
  );

  if (existingItem.state !== "Indexed") {
    sendEvent({
      type: "riven.media-item.scrape.error.incorrect-state",
      item: existingItem,
    });

    return;
  }

  let rank = 1;

  const em = database.em.fork();
  const newStreams: Stream[] = [];

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
    stream.parents.add(existingItem);

    newStreams.push(stream);

    em.persist(stream);
  }

  if (newStreams.length > 0) {
    logger.info(
      `Added ${newStreams.length.toString()} new streams to ${existingItem.title ?? "Unknown"}: ${id.toString()}`,
    );
  } else {
    logger.info(
      `No new streams found for ${existingItem.title ?? "Unknown"}: #${id.toString()}`,
    );

    existingItem.failedAttempts++;
  }

  existingItem.state = "Scraped";
  existingItem.scrapedAt = new Date();
  existingItem.scrapedTimes++;
  existingItem.streams.add(newStreams);

  em.persist(existingItem);

  try {
    await validateOrReject(existingItem);

    await em.flush();

    return await database.mediaItem.findOneOrFail(
      { id },
      { populate: ["streams:ref"] },
    );
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    sendEvent({
      type: "riven.media-item.scrape.error",
      item: existingItem,
      error: Array.isArray(parsedError)
        ? parsedError
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ")
        : parsedError.message,
    });

    throw error;
  }
}

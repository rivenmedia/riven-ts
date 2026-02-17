import { Stream } from "@repo/util-plugin-sdk/dto/entities";

import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import z from "zod";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";

import type { MainRunnerMachineIntake } from "../../../../state-machines/main-runner/index.ts";
import type { RankedResult } from "@repo/util-rank-torrent-name";

export interface PersistScrapeResultsInput {
  id: number;
  results: RankedResult[];
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

  if (existingItem.state !== "indexed") {
    sendEvent({
      type: "riven.media-item.scrape.error.incorrect-state",
      item: existingItem,
    });

    return;
  }

  const em = database.em.fork();
  const newStreams: Stream[] = [];

  for (const { data, hash, levRatio, rank } of results) {
    if (
      [...existingItem.streams, ...existingItem.blacklistedStreams].some(
        (s) => s.infoHash === hash,
      )
    ) {
      continue;
    }

    const stream = em.create(Stream, {
      infoHash: hash,
      rawTitle: data.rawTitle,
      parsedTitle: data.title,
      rank,
      levRatio,
    });

    stream.parents.add(existingItem);

    newStreams.push(stream);
  }

  if (newStreams.length > 0) {
    logger.info(
      `Added ${newStreams.length.toString()} new streams to ${existingItem.title}: #${id.toString()}`,
    );
  } else {
    logger.info(
      `No new streams found for ${existingItem.title}: #${id.toString()}`,
    );

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

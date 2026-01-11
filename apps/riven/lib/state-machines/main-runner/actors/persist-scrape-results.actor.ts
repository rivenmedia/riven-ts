import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { MediaItemScrapeRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item/scrape-requested";

export interface PersistScrapeResultsInput extends MediaItemScrapeRequestedResponse {
  sendEvent: MainRunnerMachineIntake;
}

export async function persistScrapeResults({
  id,
  results,
  // sendEvent,
}: PersistScrapeResultsInput) {
  const existingItem = await database.manager.findOneByOrFail(MediaItem, {
    id,
  });

  if (existingItem.state !== "Indexed") {
    // sendEvent({
    //   type: "riven.media-item.index.already-exists",
    //   item: {
    //     ...item,
    //     id: existingItem.id,
    //     title: existingItem.title,
    //   },
    // });

    return;
  }

  console.log(results);

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

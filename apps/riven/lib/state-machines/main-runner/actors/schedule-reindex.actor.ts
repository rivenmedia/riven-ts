import chalk from "chalk";
import { DateTime } from "luxon";
import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { enqueueProcessItemRequest } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

import type { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

export interface ScheduleReindexInput {
  item: Movie | Show;
}

export const scheduleReindex = fromPromise<undefined, ScheduleReindexInput>(
  async ({ input: { item } }) => {
    const { isReleaseDateKnown, isReleaseDateInPast, reindexTime } =
      await services.indexerService.calculateReindexTime(item);

    if (!isReleaseDateKnown) {
      logger.verbose(
        `No known release date for "${chalk(item.fullTitle)}". Using fallback of ${settings.unknownAirDateOffsetDays.toString()} days.`,
      );
    }

    if (isReleaseDateInPast) {
      logger.verbose(
        `Release date for "${chalk(item.fullTitle)}" is in the past but updated episode information has not yet been found. Will attempt to reindex in ${settings.scheduleOffsetMinutes.toString()} minutes.`,
      );
    }

    const jobDelay = reindexTime.diffNow().as("milliseconds");
    const itemRequest = await item.itemRequest.loadOrFail();

    await enqueueProcessItemRequest(
      { item: itemRequest },
      {
        delay: jobDelay,
        deduplication: {
          id: `reindex-item-${item.id}`,
          ttl: jobDelay,
        },
      },
    );

    logger.info(
      `Scheduled re-index at ${chalk.bold(reindexTime.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY))} for ${chalk.bold(item.fullTitle)}.`,
    );
  },
);

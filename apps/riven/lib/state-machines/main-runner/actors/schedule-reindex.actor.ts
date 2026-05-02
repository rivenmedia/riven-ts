import { Movie, type Show } from "@rivenmedia/plugin-sdk/dto/entities";

import chalk from "chalk";
import { DateTime } from "luxon";
import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { enqueueProcessItemRequest } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

export interface ScheduleReindexInput {
  item: Movie | Show;
}

export const scheduleReindex = fromPromise<undefined, ScheduleReindexInput>(
  async ({ input: { item } }) => {
    const { isFallback, reindexTime } =
      await services.indexerService.calculateReindexTime(item);

    if (isFallback) {
      logger.verbose(
        `No known release date for ${item.type} "${chalk(item.fullTitle)}". Using fallback of ${settings.unknownAirDateOffsetDays.toString()} days.`,
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
      `Scheduled re-index at ${chalk.bold(reindexTime.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY))} for ${item.type} ${chalk.bold(item.fullTitle)}.`,
    );
  },
);

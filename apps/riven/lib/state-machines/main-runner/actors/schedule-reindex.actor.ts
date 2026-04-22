import { Movie, type Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import { fromPromise } from "xstate";

import { enqueueProcessItemRequest } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

export interface ScheduleReindexInput {
  item: Movie | Show;
}

export const scheduleReindex = fromPromise<undefined, ScheduleReindexInput>(
  async ({ input: { item } }) => {
    const itemReleaseDate =
      item instanceof Movie ? item.releaseDate : item.nextAirDate;

    if (!itemReleaseDate) {
      logger.verbose(
        `No known release date for ${item.type} "${item.fullTitle}". Using fallback of ${settings.unknownAirDateOffsetDays.toString()} days.`,
      );
    }

    const scheduleFor = itemReleaseDate
      ? DateTime.fromJSDate(itemReleaseDate).plus({
          minutes: settings.scheduleOffsetMinutes,
        })
      : DateTime.now().plus({ days: settings.unknownAirDateOffsetDays });

    const jobDelay = scheduleFor.diffNow().as("milliseconds");
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
      `Scheduled re-index at ${scheduleFor.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)} for ${item.type} "${item.fullTitle}".`,
    );
  },
);

import { Movie, type Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import { fromPromise } from "xstate";

import {
  type EnqueueIndexItemInput,
  enqueueIndexItem,
} from "../../../message-queue/flows/index-item/enqueue-index-item.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

export interface ScheduleReindexInput extends Pick<
  EnqueueIndexItemInput,
  "subscribers"
> {
  item: Movie | Show;
}

export const scheduleReindex = fromPromise<undefined, ScheduleReindexInput>(
  async ({ input: { item, subscribers } }) => {
    const knownScheduleDate =
      item instanceof Movie ? item.releaseDate : item.nextAirDate;

    const fallbackScheduleDate = DateTime.now().plus({
      days: settings.unknownAirDateOffsetDays,
    });

    if (!knownScheduleDate) {
      logger.verbose(
        `No known release date for ${item.type} "${item.fullTitle}". Scheduling re-index using fallback date.`,
      );
    }

    const scheduleFor = DateTime.fromJSDate(
      knownScheduleDate ?? fallbackScheduleDate.toJSDate(),
    ).plus({
      minutes: settings.scheduleOffsetMinutes,
    });

    const jobDelay = scheduleFor.diffNow().as("milliseconds");
    const itemRequest = await item.itemRequest.loadOrFail();

    await enqueueIndexItem(
      {
        item: itemRequest,
        subscribers,
      },
      {
        delay: jobDelay,
        deduplication: {
          id: `reindex-${item.type}-${item.id.toString()}`,
          ttl: jobDelay,
          replace: true,
        },
      },
    );

    logger.info(
      `Scheduled re-index at ${scheduleFor.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)} for ${item.type} "${item.fullTitle}".`,
    );
  },
);

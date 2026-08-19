import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";
import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { enqueueProcessItemRequest } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";
import { queueRegistry } from "../../../message-queue/utilities/queue-registry.ts";
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
    } else if (isReleaseDateInPast) {
      logger.verbose(
        `Release date for "${chalk(item.fullTitle)}" is in the past. Will attempt to reindex in ${settings.scheduleOffsetMinutes.toString()} minutes.`,
      );
    }

    const jobDelay = reindexTime.diffNow().as("milliseconds");
    const itemRequest = await item.itemRequest.loadOrFail();

    const queueName = "process-item-request";
    const queue = queueRegistry.get(queueName);

    assert.ok(queue, `Unable to find ${queueName} queue in registry`);

    const deduplicationId = `reindex-item-${item.id}`;
    const deduplicationJobId =
      await queue.getDeduplicationJobId(deduplicationId);

    if (deduplicationJobId) {
      logger.verbose(
        `A re-index job for ${chalk.bold(item.fullTitle)} is already scheduled. Skipping scheduling.`,
      );

      return;
    }

    await enqueueProcessItemRequest(
      { item: itemRequest },
      {
        delay: jobDelay,
        deduplication: {
          id: deduplicationId,
          ttl: jobDelay,
        },
      },
    );

    logger.info(
      `Scheduled re-index at ${chalk.bold(reindexTime.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY))} for ${chalk.bold(item.fullTitle)}.`,
    );
  },
);

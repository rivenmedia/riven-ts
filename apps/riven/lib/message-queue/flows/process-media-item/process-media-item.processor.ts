import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { ValidationError } from "@mikro-orm/core";
import { DelayedError, UnrecoverableError, WaitingChildrenError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { processMediaItemProcessorSchema } from "./process-media-item.schema.ts";
import { enqueueDownloadItem } from "./steps/download/enqueue-download-item.ts";
import { enqueueScrapeItems } from "./steps/scrape/enqueue-scrape-items.ts";

import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

export const processItemProcessor =
  processMediaItemProcessorSchema.implementAsync(async function (
    { job, token },
    {
      services: {
        downloaderService,
        indexerService,
        scraperService,
        mediaItemService,
      },
      plugins,
    },
  ) {
    assert(token, "Job token is required");

    const parent = createJobParentConfig(job);

    try {
      while (job.data.step !== "complete") {
        switch (job.data.step) {
          case "scrape": {
            if (
              job.data.nextScrapeAttemptTimestamp &&
              DateTime.utc().toMillis() <= job.data.nextScrapeAttemptTimestamp
            ) {
              const { nextScrapeAttemptTimestamp, ...data } = job.data;

              await job.moveToDelayed(
                job.data.nextScrapeAttemptTimestamp,
                token,
              );

              await job.updateData(data);

              throw new DelayedError();
            }

            const itemToScrape = await scraperService.getItemToScrape(
              job.data.mediaItem.id,
              job.data.mediaItem.type,
            );

            await enqueueScrapeItems({
              items: [itemToScrape],
              subscribers: getPluginEventSubscribers(
                "riven.media-item.scrape.requested",
                plugins,
              ),
              parent,
            });

            await job.updateData({
              ...job.data,
              step: "download",
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "download": {
            const childFailures = await job.getIgnoredChildrenFailures();

            if (Object.keys(childFailures).length) {
              throw new UnrecoverableError(
                `${chalk.bold(job.data.mediaItem.fullTitle)} failed to scrape after all attempts`,
              );
            }

            const item = await downloaderService.getItemToDownload(
              job.data.mediaItem.id,
            );

            await enqueueDownloadItem({
              item,
              opts: { parent: parent },
            });

            await job.updateData({
              ...job.data,
              step: "validate",
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "validate": {
            const childFailures = await job.getIgnoredChildrenFailures();

            if (Object.keys(childFailures).length) {
              const nextScrapeAttemptTimestamp = DateTime.utc().plus({
                minutes: 30,
              });

              logger.info(
                `Scheduling re-scrape for ${chalk.bold(job.data.mediaItem.fullTitle)} in ${nextScrapeAttemptTimestamp.diffNow("minutes").toHuman()}`,
              );

              await job.log("Scheduling re-scrape due to download failure");
              await job.updateData({
                ...job.data,
                step: "scrape",
                nextScrapeAttemptTimestamp:
                  nextScrapeAttemptTimestamp.toMillis(),
              });
            } else {
              await job.updateData({
                ...job.data,
                step: "complete",
              });
            }

            break;
          }
        }
      }

      const item = await mediaItemService.getMediaItem(job.data.mediaItem.id);

      const successfulStates: MediaItemState[] = [
        "completed",
        "ongoing",
        "partially_completed",
      ];

      if (!successfulStates.includes(item.state)) {
        throw new UnrecoverableError(
          `Processing of ${chalk.bold(item.fullTitle)} did not complete successfully. Final state: ${item.state}`,
        );
      }

      const incompleteItems = await item.getIncompleteItems();

      if (incompleteItems.length === 0) {
        const duration = DateTime.fromMillis(job.timestamp)
          .diffNow(["seconds", "minutes", "hours", "days", "weeks"])
          .rescale()
          .negate()
          .toHuman({
            showZeros: false,
            maximumFractionDigits: 0,
            unitDisplay: "narrow",
          });

        logger.info(
          chalk.greenBright(
            `${chalk.bold(item.fullTitle)} completed in ${chalk.bold(duration)}`,
          ),
        );
      }

      if (item instanceof Season || item instanceof Episode) {
        const show = await item.getShow();
        const showIncompleteItems = await show.getIncompleteItems();

        if (showIncompleteItems.length === 0) {
          if (show.state === "ongoing") {
            const { reindexTime } =
              await indexerService.calculateReindexTime(show);

            const nextAirDateMessage = show.nextAirDate
              ? `New episodes will attempt to be downloaded at ${chalk.bold(reindexTime.toLocaleString(DateTime.DATETIME_SHORT))}.`
              : "";

            logger.info(
              chalk.greenBright(
                `${chalk.bold(show.fullTitle)} completed all available episodes. ${nextAirDateMessage}`.trim(),
              ),
            );
          } else {
            logger.info(
              chalk.greenBright(`${chalk.bold(show.fullTitle)} completed`),
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new UnrecoverableError(error.message);
      }

      throw error;
    }
  });

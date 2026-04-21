import { ValidationError } from "@mikro-orm/core";
import {
  DelayedError,
  type ParentOptions,
  UnrecoverableError,
  WaitingChildrenError,
} from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { enqueueDownloadItem } from "../download-item/enqueue-download-item.ts";
import { enqueueScrapeItems } from "../scrape-item/enqueue-scrape-items.ts";
import { processMediaItemProcessorSchema } from "./process-media-item.schema.ts";

export const processItemProcessor =
  processMediaItemProcessorSchema.implementAsync(async function (
    { job, token },
    { services, plugins },
  ) {
    assert(job.id, "Job ID is required");
    assert(token, "Job token is required");

    const jobParent = {
      id: job.id,
      queue: job.queueQualifiedName,
    } satisfies ParentOptions;

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

            const itemToScrape = await services.scraperService.getItemToScrape(
              job.data.mediaItem.id,
              job.data.mediaItem.type,
            );

            await enqueueScrapeItems({
              items: [itemToScrape],
              subscribers: getPluginEventSubscribers(
                "riven.media-item.scrape.requested",
                plugins,
              ),
              parent: jobParent,
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
                `${chalk.bold(job.data.mediaItem.title)} failed to scrape after all attempts`,
              );
            }

            const item = await services.downloaderService.getItemToDownload(
              job.data.mediaItem.id,
            );

            await enqueueDownloadItem({
              item,
              opts: { parent: jobParent },
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
            const childFailures = Object.values(
              await job.getIgnoredChildrenFailures(),
            );

            if (childFailures[0]) {
              const nextScrapeAttemptTimestamp = DateTime.utc().plus({
                minutes: 30,
              });

              logger.info(
                `Scheduling re-scrape for ${chalk.bold(job.data.mediaItem.title)} in ${nextScrapeAttemptTimestamp.diffNow("minutes").toHuman()}`,
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

      const item = await services.mediaItemService.getMediaItem(
        job.data.mediaItem.id,
      );

      if (item.state !== "completed") {
        throw new UnrecoverableError(
          `Processing of ${chalk.bold(item.fullTitle)} did not complete successfully. Final state: ${item.state}`,
        );
      }

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
          `${chalk.bold(item.fullTitle)} completed in ${duration}`,
        ),
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new UnrecoverableError(error.message);
      }

      throw error;
    }
  });

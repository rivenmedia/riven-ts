import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { ValidationError } from "@mikro-orm/core";
import { DelayedError, UnrecoverableError, WaitingChildrenError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { enqueuePostProcessMediaItem } from "../post-process-media-item/enqueue-post-process-media-item.ts";
import { processMediaItemProcessorSchema } from "./process-media-item.schema.ts";
import { enqueueDownloadItem } from "./steps/download/enqueue-download-item.ts";
import { enqueueScrapeItem } from "./steps/scrape/enqueue-scrape-item.ts";

import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

export const processMediaItemProcessor =
  processMediaItemProcessorSchema.implementAsync(async function (
    { job, token },
    {
      services: {
        downloaderService,
        indexerService,
        scraperService,
        mediaItemService,
        postProcessingService,
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
            const itemToScrape = await scraperService.getItemToScrape(
              job.data.mediaItem.id,
              job.data.mediaItem.type,
            );

            const scrapeItemJobNode = await enqueueScrapeItem({
              item: itemToScrape,
              subscribers: getPluginEventSubscribers(
                "riven.media-item.scrape.requested",
                plugins,
              ),
              parent,
              isRootItem: job.data.isRootItem,
            });

            if (scrapeItemJobNode === null) {
              throw new UnrecoverableError(
                `${chalk.bold(itemToScrape.fullTitle)} has exhausted all scrape attempts and cannot be scraped again`,
              );
            }

            await job.updateData({
              ...job.data,
              step: "validate-scrape",
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "validate-scrape": {
            const { ignored = 0 } = await job.getDependenciesCount({
              ignored: true,
            });

            if (ignored > 0) {
              if (job.data.isRootItem) {
                // If the root item got to this point, it has exhausted all scraping attempts.
                throw new UnrecoverableError(
                  `${chalk.bold(job.data.mediaItem.fullTitle)} failed to scrape after all attempts`,
                );
              }

              // For child items, we only try once, as they are enqueued as part of a fan-out process.
              // If they fail, the parent will retry in the future and recreate the child attempts.
              throw new UnrecoverableError(
                `${chalk.bold(job.data.mediaItem.fullTitle)} failed to scrape`,
              );
            }

            await job.updateData({
              ...job.data,
              step: "download",
            });

            break;
          }
          case "download": {
            const item = await downloaderService.getItemToDownload(
              job.data.mediaItem.id,
            );

            const streams = await item.streams.loadItems();

            await enqueueDownloadItem({
              item,
              streams,
              opts: { parent: parent },
            }).enqueue();

            await job.updateData({
              ...job.data,
              step: "validate-download",
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "validate-download": {
            const { ignored = 0 } = await job.getDependenciesCount({
              ignored: true,
            });

            if (ignored > 0) {
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
              });

              await job.moveToDelayed(
                nextScrapeAttemptTimestamp.toMillis(),
                token,
              );

              throw new DelayedError();
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

      const item = await mediaItemService.getMediaItemById(
        job.data.mediaItem.id,
      );

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
            `${chalk.bold(item.fullTitle)} downloaded in ${chalk.bold(duration)}`,
          ),
        );
      }

      if (item instanceof Season || item instanceof Episode) {
        const show = await item.getShow();
        const showIncompleteItems = await show.getIncompleteItems();

        if (showIncompleteItems.length === 0) {
          const showUnrequestedItems = await show.getUnrequestedItems();
          const hasUnrequestedItems = showUnrequestedItems.length > 0;

          if (show.state === "ongoing") {
            const { reindexTime } =
              await indexerService.calculateReindexTime(show);

            const nextAirDateMessage = show.nextAirDate
              ? `New episodes will ${hasUnrequestedItems ? "be indexed" : "attempt to be downloaded"} at ${chalk.bold(reindexTime.toLocaleString(DateTime.DATETIME_SHORT))}.`
              : "";

            logger.info(
              chalk.greenBright(
                `${chalk.bold(show.fullTitle)} downloaded all ${hasUnrequestedItems ? "requested" : "available"} episodes. ${nextAirDateMessage}`.trim(),
              ),
            );
          } else {
            logger.info(
              chalk.greenBright(
                `${chalk.bold(show.fullTitle)} successfully downloaded${hasUnrequestedItems ? " all requested episodes" : ""}.`,
              ),
            );
          }
        }
      }

      if (postProcessingService.itemRequiresPostProcessing(item, plugins)) {
        await enqueuePostProcessMediaItem({ id: item.id });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new UnrecoverableError(error.message);
      }

      throw error;
    }
  });

import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { NotFoundError, ValidationError } from "@mikro-orm/core";
import { DelayedError, UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { formatJobDuration } from "../../utilities/format-job-duration.ts";
import { maybeWaitForChildren } from "../../utilities/maybe-wait-for-children.ts";
import { enqueuePostProcessMediaItem } from "../post-process-media-item/enqueue-post-process-media-item.ts";
import { processMediaItemProcessorSchema } from "./process-media-item.schema.ts";
import { enqueueDownloadItem } from "./steps/download/enqueue-download-item.ts";
import { enqueueScrapeItem } from "./steps/scrape/enqueue-scrape-item.ts";

import type { IndexerService } from "../../../database/services/indexer/indexer.service.ts";
import type { MediaItemService } from "../../../database/services/media-item/media-item.service.ts";
import type { ProcessMediaItemFlow } from "./process-media-item.schema.ts";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { UUID } from "node:crypto";

type ProcessMediaItemJob = Parameters<
  ProcessMediaItemFlow["processor"]
>[0]["job"];

async function assertMediaItemExists(
  mediaItemService: MediaItemService,
  id: UUID,
) {
  try {
    await mediaItemService.getMediaItemById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnrecoverableError(`Media item with ID ${id} not found`);
    }

    throw error;
  }
}

async function assertScrapeSucceeded(job: ProcessMediaItemJob) {
  const { ignored = 0 } = await job.getDependenciesCount({
    ignored: true,
  });

  if (ignored === 0) {
    return;
  }

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

async function validateDownload(job: ProcessMediaItemJob, token: string) {
  const { ignored = 0 } = await job.getDependenciesCount({
    ignored: true,
  });

  if (ignored === 0) {
    await job.updateData({
      ...job.data,
      step: "complete",
    });

    return;
  }

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

  await job.moveToDelayed(nextScrapeAttemptTimestamp.toMillis(), token);

  throw new DelayedError();
}

async function logShowCompletion(show: Show, indexerService: IndexerService) {
  const showIncompleteItems = await show.getIncompleteItems();

  if (showIncompleteItems.length > 0) {
    return;
  }

  const showUnrequestedItems = await show.getUnrequestedItems();
  const hasUnrequestedItems = showUnrequestedItems.length > 0;

  if (show.status !== "continuing") {
    const requestedEpisodesLabel = hasUnrequestedItems
      ? " all requested episodes"
      : "";

    logger.info(
      chalk.greenBright(
        `${chalk.bold(show.fullTitle)} successfully downloaded${requestedEpisodesLabel}.`,
      ),
    );

    return;
  }

  const { reindexTime } = await indexerService.calculateReindexTime(show);

  const futureEpisodeActionLabel = hasUnrequestedItems
    ? "be indexed"
    : "attempt to be downloaded";

  const nextAirDateMessage = show.nextAirDate
    ? `New episodes will ${futureEpisodeActionLabel} at ${chalk.bold(reindexTime.toLocaleString(DateTime.DATETIME_SHORT))}.`
    : "";

  const downloadedEpisodesLabel = hasUnrequestedItems
    ? "requested"
    : "available";

  logger.info(
    chalk.greenBright(
      `${chalk.bold(show.fullTitle)} downloaded all ${downloadedEpisodesLabel} episodes. ${nextAirDateMessage}`.trim(),
    ),
  );
}

export const processMediaItemProcessor =
  processMediaItemProcessorSchema.implementAsync(
    async (
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
    ) => {
      await assertMediaItemExists(mediaItemService, job.data.mediaItem.id);

      assert.ok(token, "Job token is required");

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

              await maybeWaitForChildren(job, token);

              break;
            }
            case "validate-scrape": {
              await assertScrapeSucceeded(job);

              await job.updateData({
                ...job.data,
                step: "download",
              });

              break;
            }
            case "download": {
              const itemToDownload = await downloaderService.getItemToDownload(
                job.data.mediaItem.id,
              );

              await enqueueDownloadItem({
                item: itemToDownload,
                opts: { parent },
              });

              await job.updateData({
                ...job.data,
                step: "validate-download",
              });

              await maybeWaitForChildren(job, token);

              break;
            }
            case "validate-download": {
              await validateDownload(job, token);

              break;
            }
          }
        }

        const item = await mediaItemService.getMediaItemById(
          job.data.mediaItem.id,
        );

        const successfulStates = new Set<MediaItemState>([
          "completed",
          "partially_completed",
        ]);

        if (!successfulStates.has(item.state)) {
          throw new UnrecoverableError(
            `Processing of ${chalk.bold(item.fullTitle)} did not complete successfully. Final state: ${item.state}`,
          );
        }

        const incompleteItems = await item.getIncompleteItems();

        if (incompleteItems.length === 0) {
          logger.info(
            chalk.greenBright(
              `${chalk.bold(item.fullTitle)} downloaded in ${chalk.bold(formatJobDuration(job.timestamp))}`,
            ),
          );
        }

        if (item instanceof Season || item instanceof Episode) {
          await logShowCompletion(await item.getShow(), indexerService);
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
    },
  );

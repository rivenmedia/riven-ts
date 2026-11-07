import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { ValidationError } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import assert from "node:assert";

import { enqueuePostProcessMediaItem } from "#message-queue/flows/post-process-media-item/enqueue-post-process-media-item.ts";
import { createJobParentConfig } from "#message-queue/utilities/create-job-parent-config.ts";
import { formatJobDuration } from "#message-queue/utilities/format-job-duration.ts";
import { maybeWaitForChildren } from "#message-queue/utilities/maybe-wait-for-children.ts";
import { getPluginEventSubscribers } from "#state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "#utilities/logger/logger.ts";

import { processMediaItemProcessorSchema } from "./process-media-item.schema.ts";
import { logShowCompletion } from "./steps/complete/log-show-completion.ts";
import { enqueueDownloadItem } from "./steps/download/enqueue-download-item.ts";
import { enqueueScrapeItem } from "./steps/scrape/enqueue-scrape-item.ts";
import { validateDownload } from "./steps/validate-download/validate-download.ts";
import { assertScrapeSucceeded } from "./steps/validate-scrape/assert-scrape-succeeded.ts";
import { assertMediaItemExists } from "./utilities/assert-media-item-exists.ts";

import type { ProcessMediaItemFlow } from "./process-media-item.schema.ts";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

export type ProcessMediaItemJob = Parameters<
  ProcessMediaItemFlow["processor"]
>[0]["job"];

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

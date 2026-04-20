import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import {
  type ParentOptions,
  UnrecoverableError,
  WaitingChildrenError,
} from "bullmq";
import chalk from "chalk";
import assert from "node:assert";

import { database } from "../../../database/database.ts";
import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
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

    while (job.data.step !== "complete") {
      switch (job.data.step) {
        case "scrape": {
          const itemsToScrape = await services.scraperService.getItemsToScrape(
            job.data.mediaItem.id,
            job.data.mediaItem.type,
          );

          await enqueueScrapeItems({
            items: itemsToScrape,
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

          if (!item) {
            throw new UnrecoverableError(
              `${job.data.mediaItem.title} not found`,
            );
          }

          if (item.state === "failed") {
            throw new UnrecoverableError(
              `Failed to scrape ${chalk.bold(item.fullTitle)}`,
            );
          }

          await enqueueDownloadItem({
            item,
            subscribers: getPluginEventSubscribers(
              "riven.media-item.download.requested",
              plugins,
            ),
            opts: {
              parent: jobParent,
            },
          });

          await job.updateData({
            ...job.data,
            step: "complete",
          });

          if (await job.moveToWaitingChildren(token)) {
            throw new WaitingChildrenError();
          }

          break;
        }
      }
    }

    const childFailures = Object.values(await job.getIgnoredChildrenFailures());

    if (childFailures[0]) {
      throw new UnrecoverableError(
        `${chalk.bold(job.data.mediaItem.title)} failed to download: ${childFailures[0]}`,
      );
    }

    // Validate the final state of the item after all processing is complete

    const item = await database.em
      .fork()
      .getRepository(MediaItem)
      .findOneOrFail({
        id: job.data.mediaItem.id,
      });

    if (item.state !== "completed") {
      throw new UnrecoverableError(
        `Processing of ${chalk.bold(item.fullTitle)} did not complete successfully. Final state: ${item.state}`,
      );
    }
  });

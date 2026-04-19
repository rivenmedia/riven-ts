import { type ParentOptions, WaitingChildrenError } from "bullmq";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { enqueueDownloadItem } from "../download-item/enqueue-download-item.ts";
import { enqueueIndexItem } from "../index-item/enqueue-index-item.ts";
import { enqueueScrapeItems } from "../scrape-item/enqueue-scrape-items.ts";
import { processItemProcessorSchema } from "./process-item.schema.ts";

export const processItemProcessor = processItemProcessorSchema.implementAsync(
  async function ({ job, token }, { services, plugins }) {
    assert(job.id, "Job ID is required");
    assert(token, "Job token is required");

    const jobParent = {
      id: job.id,
      queue: job.queueQualifiedName,
    } satisfies ParentOptions;

    const { priority } = job;

    while (job.data.step !== "complete") {
      switch (job.data.step) {
        case "index": {
          const itemRequest = await services.itemRequestService.getItemRequest(
            job.data.requestId,
          );

          await enqueueIndexItem(
            {
              item: itemRequest,
              subscribers: getPluginEventSubscribers(
                "riven.media-item.index.requested",
                plugins,
              ),
            },
            { parent: jobParent },
          );

          await job.updateData({
            ...job.data,
            step: "scrape",
          });

          await job.changePriority({ priority: priority - 1 });

          if (await job.moveToWaitingChildren(token)) {
            throw new WaitingChildrenError();
          }

          break;
        }
        case "scrape": {
          const itemsToScrape = await services.scraperService.getItemsToScrape(
            job.data.requestId,
            job.data.scrapeLevel,
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

          await job.changePriority({ priority: priority - 1 });

          if (await job.moveToWaitingChildren(token)) {
            throw new WaitingChildrenError();
          }

          break;
        }
        case "download": {
          const item = await services.itemRequestService.getItemRequest(
            job.data.requestId,
          );
          const mediaItems = await item.mediaItems.loadItems({
            where: {
              state: "scraped",
            },
          });

          for (const mediaItem of mediaItems) {
            await enqueueDownloadItem({
              item: mediaItem,
              subscribers: getPluginEventSubscribers(
                "riven.media-item.download.requested",
                plugins,
              ),
              opts: {
                parent: jobParent,
              },
            });
          }

          await job.updateData({
            ...job.data,
            step: "complete",
          });

          await job.changePriority({ priority: priority - 1 });

          if (await job.moveToWaitingChildren(token)) {
            throw new WaitingChildrenError();
          }

          break;
        }
      }
    }
  },
);

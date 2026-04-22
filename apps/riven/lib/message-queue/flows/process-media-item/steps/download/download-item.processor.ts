import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";

import { downloadItemProcessorSchema } from "./download-item.schema.ts";

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function (
    { job },
    { sendEvent, services: { mediaItemService, downloaderService } },
  ) {
    const [finalResult] = Object.values(await job.getChildrenValues());

    const item = await mediaItemService.getMediaItem(job.data.id);

    if (!finalResult) {
      const error = new Error(
        "No valid torrent found after trying all downloaders",
      );

      sendEvent({
        type: "riven.media-item.download.error",
        item,
        error,
      });

      throw new UnrecoverableError(
        `Failed to download ${chalk.bold(item.fullTitle)}: ${error.message}`,
      );
    }

    try {
      const updatedItem = await downloaderService.downloadItem(
        job.data.id,
        finalResult.result,
        finalResult.plugin,
      );

      const incompleteItems = await updatedItem.getIncompleteItems();

      if (incompleteItems.length) {
        sendEvent({
          type: "riven.media-item.download.partial-success",
          item: updatedItem,
          downloader: finalResult.plugin,
        });

        return;
      }

      sendEvent({
        type: "riven.media-item.download.success",
        item: updatedItem,
        downloader: finalResult.plugin,
        durationMs: DateTime.utc()
          .diff(DateTime.fromMillis(job.timestamp))
          .as("milliseconds"),
        provider: finalResult.result.provider,
      });
    } catch (error) {
      if (
        error instanceof MediaItemDownloadError ||
        error instanceof MediaItemDownloadErrorIncorrectState
      ) {
        sendEvent(error.payload);

        throw new UnrecoverableError(
          `Failed to persist download results for ${item.fullTitle}: ${error.message}`,
        );
      }

      throw error;
    }
  },
);

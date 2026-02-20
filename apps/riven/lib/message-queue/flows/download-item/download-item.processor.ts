import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { UnrecoverableError } from "bullmq";
import { DateTime } from "luxon";

import { downloadItemProcessorSchema } from "./download-item.schema.ts";
import { persistDownloadResults } from "./utilities/persist-download-results.ts";

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function ({ job }, sendEvent) {
    const [finalResult] = Object.values(await job.getChildrenValues());

    if (!finalResult) {
      throw new UnrecoverableError(
        "No torrent container returned from downloaders",
      );
    }

    if (!finalResult.success) {
      throw new UnrecoverableError(
        "Downloader plugins did not return a valid torrent container",
      );
    }

    try {
      const updatedItem = await persistDownloadResults({
        id: job.data.id,
        container: finalResult.result.result,
        processedBy: finalResult.result.plugin,
      });

      sendEvent({
        type: "riven.media-item.download.success",
        item: updatedItem,
        durationFromRequestToDownload: DateTime.utc()
          .diff(DateTime.fromJSDate(updatedItem.createdAt))
          .as("seconds"),
      });

      return {
        success: true,
      };
    } catch (error) {
      if (
        error instanceof MediaItemDownloadError ||
        error instanceof MediaItemDownloadErrorIncorrectState
      ) {
        sendEvent(error.payload);

        throw new UnrecoverableError(
          `Failed to persist download results: ${String(error)}`,
        );
      }

      throw error;
    }
  },
);

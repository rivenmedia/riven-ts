import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { UnrecoverableError } from "bullmq";
import { DateTime } from "luxon";

import { database } from "../../../database/database.ts";
import { downloadItemProcessorSchema } from "./download-item.schema.ts";
import { persistDownloadResults } from "./utilities/persist-download-results.ts";

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function ({ job }, sendEvent) {
    const [finalResult] = Object.values(await job.getChildrenValues());

    if (!finalResult) {
      const item = await database.mediaItem.findOneOrFail(job.data.id);

      sendEvent({
        type: "riven.media-item.download.error",
        item,
        error: "No valid torrent container found",
      });

      throw new UnrecoverableError(
        "No torrent container returned from downloaders",
      );
    }

    try {
      const updatedItem = await persistDownloadResults({
        id: job.data.id,
        container: finalResult.result,
        processedBy: finalResult.plugin,
      });

      sendEvent({
        type: "riven.media-item.download.success",
        item: updatedItem,
        durationFromRequestToDownload: DateTime.utc()
          .diff(DateTime.fromJSDate(updatedItem.createdAt))
          .as("seconds"),
      });
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

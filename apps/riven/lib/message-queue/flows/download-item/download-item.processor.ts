import { UnrecoverableError } from "bullmq";
import { DateTime } from "luxon";

import { persistDownloadResults } from "../../../state-machines/main-runner/actors/persist-download-results.actor.ts";
import { downloadItemProcessorSchema } from "./download-item.schema.ts";

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function (job, sendEvent) {
    const children = await job.getChildrenValues();
    const [container] = Object.values(children);

    if (!container) {
      throw new UnrecoverableError(
        "No torrent container returned from downloaders",
      );
    }

    const updatedItem = await persistDownloadResults({
      id: job.data.id,
      container,
      sendEvent,
    });

    if (updatedItem) {
      sendEvent({
        type: "riven.media-item.download.success",
        item: updatedItem,
        durationFromRequestToDownload: DateTime.utc()
          .diff(DateTime.fromJSDate(updatedItem.requestedAt))
          .as("seconds"),
      });
    }

    return {
      success: true,
    };
  },
);

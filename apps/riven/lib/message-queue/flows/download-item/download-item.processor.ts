import { UnrecoverableError } from "bullmq";
import { DateTime } from "luxon";

import { persistDownloadResults } from "../../../state-machines/main-runner/actors/persist-download-results.actor.ts";
import { zipFlowChildrenResults } from "../../utilities/zip-children-results.ts";
import { downloadItemProcessorSchema } from "./download-item.schema.ts";

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function (job, sendEvent) {
    const [finalResult] = zipFlowChildrenResults(await job.getChildrenValues());

    if (!finalResult) {
      throw new UnrecoverableError(
        "No torrent container returned from downloaders",
      );
    }

    const updatedItem = await persistDownloadResults({
      id: job.data.id,
      container: finalResult.result,
      processedBy: finalResult.plugin,
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

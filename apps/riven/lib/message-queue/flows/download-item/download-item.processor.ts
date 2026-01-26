import { UnrecoverableError } from "bullmq";
import { DateTime } from "luxon";

import { persistDownloadResults } from "../../../state-machines/main-runner/actors/persist-download-results.actor.ts";
import { extractPluginNameFromJobId } from "../../utilities/extract-plugin-name-from-job-id.ts";
import { downloadItemProcessorSchema } from "./download-item.schema.ts";

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function (job, sendEvent) {
    const children = await job.getChildrenValues();
    const [jobId, container] = Object.entries(children)[0] ?? [];

    if (!jobId || !container) {
      throw new UnrecoverableError(
        "No torrent container returned from downloaders",
      );
    }

    const processedBy = extractPluginNameFromJobId(jobId);

    const updatedItem = await persistDownloadResults({
      id: job.data.id,
      container,
      processedBy,
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

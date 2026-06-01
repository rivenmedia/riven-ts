import { UnrecoverableError } from "bullmq";
import chalk from "chalk";

import { nzbDownloadItemProcessorSchema } from "./nzb-download-item.schema.ts";
import { pickFirstSuccess } from "./pick-nzb-download-result.ts";

/**
 * Aggregates NZB download responses from all nzb-download plugin child jobs
 * and picks the first successful response via the pure `pickFirstSuccess`
 * helper. The altmount plugin should return exactly one response, but the
 * aggregation pattern supports N subscribers for future flexibility.
 *
 * On at least one success: emits `riven.media-item.nzb-download.success` with
 * `itemId` + `altmountId` and returns the aggregated output so the parent
 * validate step can persist the altmountId without re-querying children.
 *
 * On zero successes / all failures: emits `riven.media-item.nzb-download.error`
 * with reason="altmount-failed" and throws an UnrecoverableError so the parent
 * flow step is marked as ignored (continueParentOnFailure=true) rather than
 * retried.
 *
 * Uses `job.data.item` (carried through from the nzb-scrape step) for log
 * messages and event ids — avoids a DB round-trip per processed job.
 */
export const nzbDownloadItemProcessor =
  nzbDownloadItemProcessorSchema.implementAsync(async function (
    { job },
    { sendEvent },
  ) {
    const children = await job.getChildrenValues();

    // Aggregate plugin responses — support N subscribers even though only
    // plugin-altmount is expected in production.
    const allResults = Object.values(children).filter(
      (result): result is NonNullable<typeof result> => result !== undefined,
    );

    const successResult = pickFirstSuccess(allResults);

    if (successResult === undefined) {
      sendEvent({
        type: "riven.media-item.nzb-download.error",
        itemId: job.data.item.id,
        reason: "altmount-failed",
        detail: `No NZB download plugin returned a successful response for ${chalk.bold(job.data.item.title)}`,
      });

      throw new UnrecoverableError(
        `NZB download failed for ${chalk.bold(job.data.item.title)}: no plugin reported success`,
      );
    }

    // A success must carry a resolved file (the plugin only fills these once
    // the download completes and the media file is located over WebDAV). Treat
    // a "success" without them as a failure so the parent step parks the item
    // rather than persisting an unusable entry.
    if (
      successResult.streamUrl === undefined ||
      successResult.fileSize === undefined ||
      successResult.originalFilename === undefined
    ) {
      sendEvent({
        type: "riven.media-item.nzb-download.error",
        itemId: job.data.item.id,
        reason: "altmount-failed",
        detail: `NZB download for ${chalk.bold(job.data.item.title)} reported success but did not resolve a media file`,
      });

      throw new UnrecoverableError(
        `NZB download for ${chalk.bold(job.data.item.title)} did not resolve a media file`,
      );
    }

    sendEvent({
      type: "riven.media-item.nzb-download.success",
      itemId: job.data.item.id,
      altmountId: successResult.altmountId,
    });

    return {
      altmountId: successResult.altmountId,
      item: job.data.item,
      streamUrl: successResult.streamUrl,
      fileSize: successResult.fileSize,
      originalFilename: successResult.originalFilename,
    };
  });

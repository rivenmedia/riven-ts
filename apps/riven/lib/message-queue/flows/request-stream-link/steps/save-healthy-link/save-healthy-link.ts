import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { DateTime, Duration } from "luxon";
import assert from "node:assert";

import { logger } from "../../../../../utilities/logger/logger.ts";

import type { StepContext } from "../../request-stream-link.processor.ts";

export async function saveHealthyLink({
  job,
  mediaEntry,
  streamService,
}: StepContext) {
  assert.ok(
    job.data.linkData,
    new UnrecoverableError(
      "Stream link data is required to save to media entry",
    ),
  );

  if (job.data.linkData.isPermalink) {
    await streamService.saveStreamPermalink(
      mediaEntry.id,
      job.data.linkData.link,
    );
  }

  const ttl = job.data.linkData.isPermalink
    ? Duration.fromObject({ hours: 3 })
    : DateTime.fromISO(job.data.linkData.expiresAt).diffNow();

  await streamService.saveStreamLink(
    mediaEntry.id,
    job.data.linkData.link,
    Math.min(ttl.as("seconds"), 60),
  );

  logger.debug(
    `Cached stream link for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)} for ${ttl.shiftTo("hours").toHuman()}`,
  );

  await job.updateData({
    ...job.data,
    step: "complete",
  });
}

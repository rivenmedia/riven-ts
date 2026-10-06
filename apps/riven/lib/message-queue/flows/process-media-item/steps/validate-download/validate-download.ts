import { DelayedError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";

import { logger } from "#utilities/logger/logger.ts";

import type { ProcessMediaItemJob } from "#message-queue/flows/process-media-item/process-media-item.processor.ts";

export async function validateDownload(
  job: ProcessMediaItemJob,
  token: string,
) {
  const { ignored = 0 } = await job.getDependenciesCount({
    ignored: true,
  });

  if (ignored === 0) {
    await job.updateData({
      ...job.data,
      step: "complete",
    });

    return;
  }

  const nextScrapeAttemptTimestamp = DateTime.utc().plus({
    minutes: 30,
  });

  logger.info(
    `Scheduling re-scrape for ${chalk.bold(job.data.mediaItem.fullTitle)} in ${nextScrapeAttemptTimestamp.diffNow("minutes").toHuman()}`,
  );

  await job.log("Scheduling re-scrape due to download failure");

  await job.updateData({
    ...job.data,
    step: "scrape",
  });

  await job.moveToDelayed(nextScrapeAttemptTimestamp.toMillis(), token);

  throw new DelayedError();
}

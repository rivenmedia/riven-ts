import { UnrecoverableError } from "bullmq";
import chalk from "chalk";

import type { ProcessMediaItemJob } from "#message-queue/flows/process-media-item/process-media-item.processor.ts";

export async function assertScrapeSucceeded(job: ProcessMediaItemJob) {
  const { ignored = 0 } = await job.getDependenciesCount({
    ignored: true,
  });

  if (ignored === 0) {
    return;
  }

  if (job.data.isRootItem) {
    // If the root item got to this point, it has exhausted all scraping attempts.
    throw new UnrecoverableError(
      `${chalk.bold(job.data.mediaItem.fullTitle)} failed to scrape after all attempts`,
    );
  }

  // For child items, we only try once, as they are enqueued as part of a fan-out process.
  // If they fail, the parent will retry in the future and recreate the child attempts.
  throw new UnrecoverableError(
    `${chalk.bold(job.data.mediaItem.fullTitle)} failed to scrape`,
  );
}

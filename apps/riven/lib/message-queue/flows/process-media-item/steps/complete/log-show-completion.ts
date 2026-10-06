import chalk from "chalk";
import { DateTime } from "luxon";

import { logger } from "#utilities/logger/logger.ts";

import type { IndexerService } from "#database/services/indexer/indexer.service.ts";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";

export async function logShowCompletion(
  show: Show,
  indexerService: IndexerService,
) {
  const showIncompleteItems = await show.getIncompleteItems();

  if (showIncompleteItems.length > 0) {
    return;
  }

  const showUnrequestedItems = await show.getUnrequestedItems();
  const hasUnrequestedItems = showUnrequestedItems.length > 0;

  if (show.status !== "continuing") {
    const requestedEpisodesLabel = hasUnrequestedItems
      ? " all requested episodes"
      : "";

    logger.info(
      chalk.greenBright(
        `${chalk.bold(show.fullTitle)} successfully downloaded${requestedEpisodesLabel}.`,
      ),
    );

    return;
  }

  const { reindexTime } = await indexerService.calculateReindexTime(show);

  const futureEpisodeActionLabel = hasUnrequestedItems
    ? "be indexed"
    : "attempt to be downloaded";

  const nextAirDateMessage = show.nextAirDate
    ? `New episodes will ${futureEpisodeActionLabel} at ${chalk.bold(reindexTime.toLocaleString(DateTime.DATETIME_SHORT))}.`
    : "";

  const downloadedEpisodesLabel = hasUnrequestedItems
    ? "requested"
    : "available";

  logger.info(
    chalk.greenBright(
      `${chalk.bold(show.fullTitle)} downloaded all ${downloadedEpisodesLabel} episodes. ${nextAirDateMessage}`.trim(),
    ),
  );
}

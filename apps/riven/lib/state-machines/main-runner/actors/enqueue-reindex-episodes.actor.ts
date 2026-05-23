import chalk from "chalk";
import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { enqueueProcessMediaItem } from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";
import { logger } from "../../../utilities/logger/logger.ts";

import type { UUID } from "node:crypto";

export interface EnqueueReindexEpisodesInput {
  showId: UUID;
}

/**
 * Fan out a re-indexed show into per-episode `process-media-item` jobs.
 *
 * This bypasses the season-level deduplication that drops fan-out attempts
 * when a previous job for the same season is still in flight (see #160).
 * Episodes use their own dedup key (`process-episode-<id>`) which only
 * collides with another in-flight job for the same episode — exactly the
 * idempotent collision we want.
 */
export const enqueueReindexEpisodes = fromPromise<
  undefined,
  EnqueueReindexEpisodesInput
>(async ({ input: { showId } }) => {
  const episodes =
    await services.mediaItemService.getReindexEpisodesToProcess(showId);

  if (episodes.length === 0) {
    logger.verbose(
      `No missing episodes to enqueue for re-indexed show ${showId}`,
    );
    return;
  }

  logger.info(
    `Enqueueing ${episodes.length.toString()} missing episode(s) for re-indexed show ${chalk.bold(
      episodes[0]?.fullTitle ?? showId,
    )}`,
  );

  for (const episode of episodes) {
    try {
      await enqueueProcessMediaItem({ id: episode.id });
    } catch (error) {
      logger.error(`Failed to enqueue episode ${episode.id} during re-index`, {
        err: error,
      });
    }
  }
});

import { UnrecoverableError } from "bullmq";
import chalk from "chalk";

import { logger } from "../../../../../utilities/logger/logger.ts";
import { enqueueProcessMediaItem } from "../../../process-media-item/enqueue-process-media-item.ts";

import type { StepContext } from "../../request-stream-link.processor.ts";

export async function blacklistStream({
  mediaEntry,
  streamService,
}: StepContext): Promise<never> {
  logger.warn(
    `Dead torrent detected. Blacklisting stream for ${chalk.bold(mediaEntry.originalFilename)}`,
  );

  try {
    const mediaItem = await mediaEntry.mediaItem.loadOrFail({
      populate: ["filesystemEntries:ref"],
    });

    const { blacklistedItems, infoHash: blacklistedInfoHash } =
      await streamService.blacklistActiveStream({
        mediaItem,
        provider: mediaEntry.provider,
        plugin: mediaEntry.plugin,
      });

    logger.info(
      `Stream ${blacklistedInfoHash} for ${chalk.bold(mediaEntry.originalFilename)} has been blacklisted`,
    );

    const itemsToReprocess = await streamService.calculateItemsToReprocess(
      new Set(blacklistedItems),
    );

    for (const item of itemsToReprocess) {
      await enqueueProcessMediaItem({ id: item.id });
    }

    throw new UnrecoverableError(
      `Dead torrent detected for ${mediaEntry.originalFilename} (${blacklistedInfoHash}). Attempting to download another hash...`,
    );
  } catch (error) {
    if (error instanceof UnrecoverableError) {
      throw error;
    }

    throw new UnrecoverableError(
      `Failed to blacklist stream for ${mediaEntry.originalFilename}: ${String(error)}`,
    );
  }
}

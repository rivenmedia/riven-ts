import chalk from "chalk";

import { logger } from "../../../../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../../../../utilities/settings.ts";
import { describeProvider } from "./describe-provider.ts";
import { getCachedTorrentFiles } from "./get-cached-torrent-files.ts";
import { getValidTorrentFiles } from "./get-valid-torrent-files.ts";

import type { FindValidTorrentContext } from "../find-valid-torrent.processor.ts";

/**
 * Checks whether the plugin has the torrent cached on the given provider, validating any cached files.
 *
 * @returns Whether a download should be attempted
 */
export async function checkCachedFiles(
  { job, mediaItem, infoHashes, parent }: FindValidTorrentContext,
  infoHash: string,
  pluginName: string,
  provider: string | null,
) {
  await job.log(`${infoHash}: Checking for cached files`);

  logger.debug(
    `Checking for ${chalk.bold(infoHash)} in ${pluginName} cache${describeProvider("for", provider)}...`,
  );

  const cachedFiles = await getCachedTorrentFiles(
    pluginName,
    infoHashes,
    parent,
    provider,
  );

  if (cachedFiles[infoHash]?.length) {
    logger.verbose(
      `Found ${chalk.bold(infoHash)} in ${pluginName} cache for ${mediaItem.fullTitle}${describeProvider("on", provider)}`,
    );

    await getValidTorrentFiles(
      mediaItem,
      infoHash,
      cachedFiles[infoHash],
      true,
      parent,
    );

    await job.log(`${infoHash}: Cached files are valid`);

    return true;
  }

  if (settings.attemptUnknownDownloads) {
    return true;
  }

  await job.log(`${infoHash}: No cached files found`);

  logger.verbose(
    `${infoHash} is not immediately available on ${pluginName}${describeProvider("via", provider)} for ${mediaItem.fullTitle}; skipping...`,
  );

  return false;
}

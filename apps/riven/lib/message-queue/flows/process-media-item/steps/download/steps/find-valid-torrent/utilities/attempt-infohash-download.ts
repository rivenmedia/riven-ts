import { logger } from "../../../../../../../../utilities/logger/logger.ts";
import { InvalidTorrentError } from "../../../../../../../sandboxed-jobs/jobs/validate-torrent-files/utilities/validate-torrent-files.ts";
import { attemptPluginDownload } from "./attempt-plugin-download.ts";

import type {
  FindValidTorrentContext,
  InfoHashAttemptState,
} from "../find-valid-torrent.processor.ts";

/**
 * Attempts to download and validate a torrent from each of the available downloader plugins.
 */
export async function attemptInfoHashDownload(
  context: FindValidTorrentContext,
  infoHash: string,
) {
  const infoHashState: InfoHashAttemptState = { didEncounterRateLimit: false };

  for (const plugin of context.availableDownloaders) {
    try {
      const result = await attemptPluginDownload(
        context,
        infoHashState,
        infoHash,
        plugin,
      );

      if (result) {
        return {
          result,
          ...infoHashState,
        };
      }
    } catch (error) {
      if (!(error instanceof InvalidTorrentError)) {
        throw error;
      }

      // If we receive a torrent validation error, it means we've actually checked its contents.
      // We can skip all processing of other providers & plugins, because the contents won't change.
      logger.debug(
        `Skipping all further processing of ${infoHash} due to failed files validation for ${context.mediaItem.fullTitle}`,
      );

      await context.job.log(`${infoHash} failed validation: ${error.message}`);

      break;
    }
  }

  return {
    result: null,
    ...infoHashState,
  };
}

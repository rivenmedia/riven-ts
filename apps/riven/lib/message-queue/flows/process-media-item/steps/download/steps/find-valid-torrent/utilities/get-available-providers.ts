import { DelayedError } from "bullmq";
import { isEmptyObject } from "es-toolkit";
import { DateTime } from "luxon";

import { logger } from "../../../../../../../../utilities/logger/logger.ts";
import { formatReattemptTime } from "./format-reattempt-time.ts";
import { getPluginProviderList } from "./get-plugin-provider-list.ts";

import type { FindValidTorrentContext } from "../find-valid-torrent.processor.ts";

/**
 * Gets the providers that should be attempted for a plugin, tracking any rate limited providers.
 *
 * @throws {DelayedError} If the only available downloader has no providers that are not rate limited
 */
export async function getAvailableProviders(
  context: FindValidTorrentContext,
  pluginName: string,
  infoHash: string,
) {
  const { providers, rateLimitedProviders } =
    await getPluginProviderList(pluginName);

  const hasRateLimitedProviders = !isEmptyObject(rateLimitedProviders);

  if (hasRateLimitedProviders) {
    const closestRateLimitReattempt = DateTime.utc().plus({
      milliseconds: Math.min(...Object.values(rateLimitedProviders)),
    });

    context.rateLimitReattemptDatetime = context.rateLimitReattemptDatetime
      ? DateTime.min(
          context.rateLimitReattemptDatetime,
          closestRateLimitReattempt,
        )
      : closestRateLimitReattempt;

    if (providers.length === 0 && context.availableDownloaders.length === 1) {
      logger.info(
        `All plugins are currently rate limited for ${context.mediaItem.fullTitle}; delaying attempts for ${formatReattemptTime(context.rateLimitReattemptDatetime)}...`,
      );

      await context.job.moveToDelayed(
        context.rateLimitReattemptDatetime.toMillis(),
        context.token,
      );

      throw new DelayedError();
    }
  }

  if (providers.length === 0) {
    logger.debug(
      hasRateLimitedProviders
        ? `Skipping ${pluginName} for ${infoHash}; all providers are currently rate limited.`
        : `Skipping ${pluginName} for ${infoHash}; no providers are configured.`,
    );
  }

  return { providers, hasRateLimitedProviders };
}

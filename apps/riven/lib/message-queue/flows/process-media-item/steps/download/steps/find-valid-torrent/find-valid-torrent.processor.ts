import { DelayedError, UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { isEmptyObject } from "es-toolkit";
import { DateTime } from "luxon";
import assert from "node:assert";
import z, { ZodError } from "zod";

import { getPluginEventSubscribers } from "../../../../../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../../../utilities/settings.ts";
import { InvalidTorrentError } from "../../../../../../sandboxed-jobs/jobs/validate-torrent-files/utilities/validate-torrent-files.ts";
import { createJobParentConfig } from "../../../../../../utilities/create-job-parent-config.ts";
import { filterChildrenValues } from "../../../../../../utilities/filter-children-values.ts";
import { findValidTorrentProcessorSchema } from "./find-valid-torrent.schema.ts";
import { getCachedTorrentFiles } from "./utilities/get-cached-torrent-files.ts";
import { getPluginDownloadResult } from "./utilities/get-plugin-download-result.ts";
import { getPluginProviderList } from "./utilities/get-plugin-provider-list.ts";
import { getValidTorrentFiles } from "./utilities/get-valid-torrent-files.ts";

import type { StreamService } from "../../../../../../../database/services/stream/stream.service.ts";
import type {
  FindValidTorrentFlow,
  ValidTorrent,
} from "./find-valid-torrent.schema.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { Scope } from "@sentry/node";
import type { ParentOptions } from "bullmq";

type FindValidTorrentJob = Parameters<
  FindValidTorrentFlow["processor"]
>[0]["job"];

type DownloaderPlugin = ReturnType<typeof getPluginEventSubscribers>[number];

interface FindValidTorrentContext {
  job: FindValidTorrentJob;
  token: string;
  scope: Scope;
  mediaItem: MediaItem;
  infoHashes: string[];
  parent: ParentOptions;
  streamService: StreamService;
  availableDownloaders: DownloaderPlugin[];
  /**
   * When a plugin indicates that a provider is rate limited,
   * we use this to delay the job until the rate limit is expected to be lifted, to avoid unnecessary attempts that are likely to fail.
   */
  rateLimitReattemptDatetime: DateTime | null;
}

function describeProvider(preposition: string, provider: string | null) {
  return provider ? ` ${preposition} ${provider}` : "";
}

function formatReattemptTime(reattemptDatetime: DateTime) {
  return reattemptDatetime
    .diffNow(["hours", "minutes", "seconds"])
    .rescale()
    .toHuman();
}

/**
 * Gets the providers that should be attempted for a plugin, tracking any rate limited providers.
 *
 * @throws {DelayedError} If the only available downloader has no providers that are not rate limited
 */
async function getAvailableProviders(
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

/**
 * Checks whether the plugin has the torrent cached on the given provider, validating any cached files.
 *
 * @returns Whether a download should be attempted
 */
async function checkCachedFiles(
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

/**
 * Attempts to download and validate a torrent from a single plugin provider.
 *
 * @returns The valid torrent, or `null` if the provider could not provide it
 * @throws {InvalidTorrentError} If the torrent's files failed validation
 */
async function attemptProviderDownload(
  context: FindValidTorrentContext,
  infoHash: string,
  plugin: DownloaderPlugin,
  pluginName: string,
  provider: string | null,
): Promise<ValidTorrent | null> {
  const { job, scope, mediaItem, parent, streamService } = context;

  const isBlacklisted = await streamService.isStreamBlacklisted({
    mediaItem,
    stream: infoHash,
    plugin: pluginName,
    provider,
  });

  if (isBlacklisted) {
    logger.debug(
      `Skipping blacklisted stream ${infoHash} on ${pluginName}${describeProvider("via", provider)} for ${chalk.bold(mediaItem.fullTitle)}`,
    );

    return null;
  }

  scope.setTag("riven.downloader-provider", provider);

  await job.log(
    `Checking ${infoHash} on ${pluginName}${describeProvider("via", provider)}`,
  );

  try {
    const hasCacheCheckHook = Boolean(
      plugin.hooks["riven.media-item.download.cache-check-requested"],
    );

    if (
      hasCacheCheckHook &&
      !(await checkCachedFiles(context, infoHash, pluginName, provider))
    ) {
      return null;
    }

    const pluginDownloadResult = await getPluginDownloadResult(
      infoHash,
      pluginName,
      provider,
      parent,
    );

    if (!pluginDownloadResult.success) {
      const isDeadTorrent = streamService.isFatalStatusCode(
        pluginDownloadResult.statusCode,
      );

      if (isDeadTorrent) {
        await streamService.blacklistStreamByInfoHash(
          mediaItem.id,
          infoHash,
          pluginName,
          provider,
        );

        logger.info(
          `Blacklisted ${infoHash} on ${pluginName}${describeProvider("via", provider)} for ${mediaItem.fullTitle} due to failed download attempt`,
        );

        await job.log(
          `${infoHash}:${pluginName}${describeProvider("via", provider)} Download attempt failed; stream blacklisted`,
        );
      }

      return null;
    }

    await job.log(`${infoHash}: Downloaded torrent metadata`);

    const validatedFiles = await getValidTorrentFiles(
      mediaItem,
      infoHash,
      pluginDownloadResult.data.files,
      false,
      parent,
    );

    await job.log(`${infoHash}: Downloaded files are valid`);

    return {
      torrentId: pluginDownloadResult.data.torrentId,
      infoHash,
      files: validatedFiles,
      provider,
    };
  } catch (error) {
    if (error instanceof InvalidTorrentError) {
      throw error;
    }

    const errorMessage =
      error instanceof ZodError ? z.prettifyError(error) : String(error);

    logger.debug(`${mediaItem.type} ${mediaItem.fullTitle} - ${errorMessage}`);

    return null;
  }
}

interface InfoHashAttemptState {
  didEncounterRateLimit: boolean;
}

/**
 * Attempts to download and validate a torrent from each of a plugin's providers.
 *
 * @throws {InvalidTorrentError} If the torrent's files failed validation
 */
async function attemptPluginDownload(
  context: FindValidTorrentContext,
  infoHashState: InfoHashAttemptState,
  infoHash: string,
  plugin: DownloaderPlugin,
) {
  const pluginName = plugin.name.description;

  assert.ok(pluginName);

  context.scope.setTag("riven.downloader-plugin", pluginName);

  const hasProviderListHook = Boolean(
    plugin.hooks["riven.media-item.download.provider-list-requested"],
  );

  const { providers, hasRateLimitedProviders } = hasProviderListHook
    ? await getAvailableProviders(context, pluginName, infoHash)
    : { providers: [null], hasRateLimitedProviders: false };

  infoHashState.didEncounterRateLimit ||= hasRateLimitedProviders;

  for (const provider of providers) {
    const result = await attemptProviderDownload(
      context,
      infoHash,
      plugin,
      pluginName,
      provider,
    );

    if (result) {
      return { plugin: pluginName, result };
    }
  }

  return null;
}

/**
 * Attempts to download and validate a torrent from each of the available downloader plugins.
 */
async function attemptInfoHashDownload(
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
        return { result, ...infoHashState };
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

  return { result: null, ...infoHashState };
}

export const findValidTorrentProcessor =
  findValidTorrentProcessorSchema.implementAsync(
    async (
      { job, scope, token },
      { services: { mediaItemService, streamService }, plugins },
    ) => {
      assert.ok(token);

      const childrenValues = filterChildrenValues(
        await job.getChildrenValues(),
        "download-item.rank-streams",
      );

      const [rankedStreams] = Object.values(childrenValues);

      if (!rankedStreams?.length) {
        throw new UnrecoverableError(
          `No streams found that match the ranking criteria for ${job.data.itemTitle}`,
        );
      }

      const {
        data: { id: mediaItemId, failedInfoHashes },
      } = job;

      const mediaItem = await mediaItemService.getMediaItemById(mediaItemId);

      const infoHashes = rankedStreams.map((stream) => stream.hash);
      const uncheckedInfoHashes = new Set(infoHashes).difference(
        new Set(failedInfoHashes),
      );

      const context: FindValidTorrentContext = {
        job,
        token,
        scope,
        mediaItem,
        infoHashes,
        parent: createJobParentConfig(job),
        streamService,
        availableDownloaders: getPluginEventSubscribers(
          "riven.media-item.download.requested",
          plugins,
        ),
        rateLimitReattemptDatetime: null,
      };

      for (const infoHash of uncheckedInfoHashes) {
        scope.setTag("riven.info-hash", infoHash);

        const { result, didEncounterRateLimit } = await attemptInfoHashDownload(
          context,
          infoHash,
        );

        if (result) {
          return result;
        }

        if (!didEncounterRateLimit) {
          logger.debug(
            `Info hash ${chalk.bold(infoHash)} failed validation for all plugins for ${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)}`,
          );

          await job.log(`${infoHash} failed validation for all plugins`);

          await job.updateData({
            ...job.data,
            failedInfoHashes: [...job.data.failedInfoHashes, infoHash],
          });
        }
      }

      const { rateLimitReattemptDatetime } = context;

      if (job.data.failedInfoHashes.length === infoHashes.length) {
        logger.info(
          `All info hashes failed validation for ${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)}; all plugins have been exhausted.`,
        );
      } else if (rateLimitReattemptDatetime) {
        logger.info(
          `Some hashes for ${chalk.bold(mediaItem.fullTitle)} were unable to download due to rate limits. Retrying in ${formatReattemptTime(rateLimitReattemptDatetime)}.`,
        );

        await job.moveToDelayed(rateLimitReattemptDatetime.toMillis(), token);

        throw new DelayedError();
      }

      return null;
    },
  );

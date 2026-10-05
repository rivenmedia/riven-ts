import chalk from "chalk";
import { z, ZodError } from "zod";

import { InvalidTorrentError } from "#message-queue/sandboxed-jobs/jobs/validate-torrent-files/utilities/validate-torrent-files.ts";
import { logger } from "#utilities/logger/logger.ts";

import { checkCachedFiles } from "./check-cached-files.ts";
import { describeProvider } from "./describe-provider.ts";
import { getPluginDownloadResult } from "./get-plugin-download-result.ts";
import { getValidTorrentFiles } from "./get-valid-torrent-files.ts";

import type { FindValidTorrentContext } from "#message-queue/flows/process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.processor.ts";
import type { ValidTorrent } from "#message-queue/flows/process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";

/**
 * Attempts to download and validate a torrent from a single plugin provider.
 *
 * @returns The valid torrent, or `null` if the provider could not provide it
 * @throws {InvalidTorrentError} If the torrent's files failed validation
 */
export async function attemptProviderDownload(
  context: FindValidTorrentContext,
  infoHash: string,
  plugin: RivenPlugin,
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

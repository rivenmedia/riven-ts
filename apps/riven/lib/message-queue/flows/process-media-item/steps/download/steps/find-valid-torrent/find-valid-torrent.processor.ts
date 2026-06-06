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

export const findValidTorrentProcessor =
  findValidTorrentProcessorSchema.implementAsync(async function (
    { job, scope, token },
    { services: { mediaItemService, streamService }, plugins },
  ) {
    assert(token);

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

    const parent = createJobParentConfig(job);

    const availableDownloaders = getPluginEventSubscribers(
      "riven.media-item.download.requested",
      plugins,
    );

    /**
     * When a plugin indicates that a provider is rate limited,
     * we use this to delay the job until the rate limit is expected to be lifted, to avoid unnecessary attempts that are likely to fail.
     */
    let rateLimitReattemptDatetime: DateTime | undefined;

    for (const infoHash of uncheckedInfoHashes) {
      scope.setTag("riven.info-hash", infoHash);

      let didEncounterRateLimitForInfoHash = false;

      for (const plugin of availableDownloaders) {
        const pluginName = plugin.name.description;

        assert(pluginName);

        scope.setTag("riven.downloader-plugin", pluginName);

        const hasCacheCheckHook =
          !!plugin.hooks["riven.media-item.download.cache-check-requested"];

        const hasProviderListHook =
          !!plugin.hooks["riven.media-item.download.provider-list-requested"];

        try {
          const { providers, rateLimitedProviders } = hasProviderListHook
            ? await getPluginProviderList(pluginName)
            : {
                providers: [null],
                rateLimitedProviders: {},
              };

          if (hasProviderListHook) {
            const hasRateLimitedProviders =
              !isEmptyObject(rateLimitedProviders);

            didEncounterRateLimitForInfoHash ||= hasRateLimitedProviders;

            if (hasRateLimitedProviders) {
              const closestRateLimitReattempt = DateTime.utc().plus({
                milliseconds: Math.min(...Object.values(rateLimitedProviders)),
              });

              rateLimitReattemptDatetime = rateLimitReattemptDatetime
                ? DateTime.min(
                    rateLimitReattemptDatetime,
                    closestRateLimitReattempt,
                  )
                : closestRateLimitReattempt;

              if (!providers.length && availableDownloaders.length === 1) {
                const formattedReattemptTime = rateLimitReattemptDatetime
                  .diffNow(["hours", "minutes", "seconds"])
                  .rescale()
                  .toHuman();

                logger.info(
                  `All plugins are currently rate limited for ${mediaItem.fullTitle}; delaying attempts for ${formattedReattemptTime}...`,
                );

                await job.moveToDelayed(
                  rateLimitReattemptDatetime.toMillis(),
                  token,
                );

                throw new DelayedError();
              }
            }

            if (!providers.length) {
              logger.debug(
                hasRateLimitedProviders
                  ? `Skipping ${pluginName} for ${infoHash}; all providers are currently rate limited.`
                  : `Skipping ${pluginName} for ${infoHash}; no providers are configured.`,
              );

              continue;
            }
          }

          for (const provider of providers) {
            const isBlacklisted = await streamService.isStreamBlacklisted({
              mediaItem,
              stream: infoHash,
              plugin: pluginName,
              provider,
            });

            if (isBlacklisted) {
              logger.debug(
                `Skipping blacklisted stream ${infoHash} on ${pluginName}${provider ? ` via ${provider}` : ""} for ${chalk.bold(mediaItem.fullTitle)}`,
              );

              continue;
            }

            scope.setTag("riven.downloader-provider", provider);

            await job.log(
              `Checking ${infoHash} on ${pluginName}${provider ? ` via ${provider}` : ""}`,
            );

            try {
              if (hasCacheCheckHook) {
                await job.log(`${infoHash}: Checking for cached files`);

                logger.debug(
                  `Checking for ${chalk.bold(infoHash)} in ${pluginName} cache${provider ? ` for ${provider}` : ""}...`,
                );

                const cachedFiles = await getCachedTorrentFiles(
                  pluginName,
                  infoHashes,
                  parent,
                  provider,
                );

                if (cachedFiles[infoHash]?.length) {
                  logger.verbose(
                    `Found ${chalk.bold(infoHash)} in ${pluginName} cache for ${mediaItem.fullTitle}${provider ? ` on ${provider}` : ""}`,
                  );

                  await getValidTorrentFiles(
                    mediaItem,
                    infoHash,
                    cachedFiles[infoHash],
                    true,
                    parent,
                  );

                  await job.log(`${infoHash}: Cached files are valid`);
                } else if (!settings.attemptUnknownDownloads) {
                  await job.log(`${infoHash}: No cached files found`);

                  logger.verbose(
                    `${infoHash} is not immediately available on ${pluginName}${provider ? ` via ${provider}` : ""} for ${mediaItem.fullTitle}; skipping...`,
                  );

                  continue;
                }
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
                    `Blacklisted ${infoHash} on ${pluginName}${provider ? ` via ${provider}` : ""} for ${mediaItem.fullTitle} due to failed download attempt`,
                  );

                  await job.log(
                    `${infoHash}:${pluginName}${provider ? ` via ${provider}` : ""} Download attempt failed; stream blacklisted`,
                  );
                }

                continue;
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
                plugin: pluginName,
                result: {
                  torrentId: pluginDownloadResult.data.torrentId,
                  infoHash,
                  files: validatedFiles,
                  provider,
                },
              };
            } catch (error) {
              if (error instanceof InvalidTorrentError) {
                throw error;
              }

              const errorMessage =
                error instanceof ZodError
                  ? z.prettifyError(error)
                  : String(error);

              logger.debug(
                `${mediaItem.type} ${mediaItem.fullTitle} - ${errorMessage}`,
              );

              continue;
            }
          }
        } catch (error) {
          if (error instanceof InvalidTorrentError) {
            // If we receive a torrent validation error, it means we've actually checked its contents.
            // We can skip all processing of other providers & plugins, because the contents won't change.
            logger.debug(
              `Skipping all further processing of ${infoHash} due to failed files validation for ${mediaItem.fullTitle}`,
            );

            await job.log(`${infoHash} failed validation: ${error.message}`);

            break;
          }

          throw error;
        }
      }

      if (!didEncounterRateLimitForInfoHash) {
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

    if (job.data.failedInfoHashes.length === infoHashes.length) {
      logger.info(
        `All info hashes failed validation for ${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)}; all plugins have been exhausted.`,
      );
    } else if (rateLimitReattemptDatetime) {
      const formattedReattemptTime = rateLimitReattemptDatetime
        .diffNow(["hours", "minutes", "seconds"])
        .rescale()
        .toHuman();

      logger.info(
        `Some hashes for ${chalk.bold(mediaItem.fullTitle)} were unable to download due to rate limits. Retrying in ${formattedReattemptTime}.`,
      );

      await job.moveToDelayed(rateLimitReattemptDatetime.toMillis(), token);

      throw new DelayedError();
    }

    return null;
  });

import { type ParentOptions, UnrecoverableError } from "bullmq";
import chalk from "chalk";
import assert from "node:assert";

import { repositories } from "../../../../../database/database.ts";
import { getPluginEventSubscribers } from "../../../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { InvalidTorrentError } from "../../../../sandboxed-jobs/jobs/validate-torrent-files/utilities/validate-torrent-files.ts";
import { findValidTorrentProcessorSchema } from "./find-valid-torrent.schema.ts";
import { getCachedTorrentFiles } from "./utilities/get-cached-torrent-files.ts";
import { getPluginDownloadResult } from "./utilities/get-plugin-download-result.ts";
import { getPluginProviderList } from "./utilities/get-plugin-provider-list.ts";
import { getValidTorrentFiles } from "./utilities/get-valid-torrent-files.ts";

export const findValidTorrentProcessor =
  findValidTorrentProcessorSchema.implementAsync(async function (
    { job, scope },
    { plugins },
  ) {
    const [rankedStreams] = Object.values(await job.getChildrenValues());

    if (!rankedStreams?.length) {
      throw new UnrecoverableError(
        `No streams found that match the ranking criteria for ${job.data.itemTitle}`,
      );
    }

    const {
      id: jobId,
      data: { id: mediaItemId, failedInfoHashes },
    } = job;

    assert(jobId);

    const mediaItem = await repositories.mediaItem.findOneOrFail(mediaItemId);

    const infoHashes = rankedStreams.map((stream) => stream.hash);
    const uncheckedInfoHashes = new Set(infoHashes)
      .difference(new Set(failedInfoHashes))
      .values();

    const jobParentOptions = {
      id: jobId,
      queue: job.queueQualifiedName,
    } satisfies ParentOptions;

    const availableDownloaders = getPluginEventSubscribers(
      "riven.media-item.download.requested",
      plugins,
    );

    for (const infoHash of uncheckedInfoHashes) {
      scope.setTag("riven.info-hash", infoHash);

      for (const plugin of availableDownloaders) {
        const pluginName = plugin.name.description;

        assert(pluginName);

        scope.setTag("riven.downloader-plugin", pluginName);

        const hasCacheCheckHook =
          !!plugin.hooks["riven.media-item.download.cache-check-requested"];

        const hasProviderListHook =
          !!plugin.hooks["riven.media-item.download.provider-list-requested"];

        try {
          const providers = hasProviderListHook
            ? await getPluginProviderList(pluginName, jobParentOptions)
            : [];

          if (hasProviderListHook && !providers.length) {
            logger.debug(
              `Skipping ${pluginName} for ${infoHash}; no providers are configured.`,
            );

            continue;
          }

          const providerList = hasProviderListHook ? providers : [null];

          for (const provider of providerList) {
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
                  jobParentOptions,
                  provider,
                );

                if (!cachedFiles[infoHash]) {
                  await job.log(`${infoHash}: No cached files found`);

                  logger.verbose(
                    `${infoHash} is not immediately available on ${pluginName}${provider ? ` via ${provider}` : ""} for ${mediaItem.fullTitle}; skipping...`,
                  );

                  continue;
                }

                logger.verbose(
                  `Found ${chalk.bold(infoHash)} in ${pluginName} cache for ${mediaItem.fullTitle}${provider ? ` on ${provider}` : ""}`,
                );

                await getValidTorrentFiles(
                  mediaItem,
                  infoHash,
                  cachedFiles[infoHash],
                  true,
                  jobParentOptions,
                );

                await job.log(`${infoHash}: Cached files are valid`);
              }

              const pluginDownloadResult = await getPluginDownloadResult(
                infoHash,
                pluginName,
                provider,
                jobParentOptions,
              );

              await job.log(`${infoHash}: Downloaded torrent metadata`);

              const validatedFiles = await getValidTorrentFiles(
                mediaItem,
                infoHash,
                pluginDownloadResult.files,
                false,
                jobParentOptions,
              );

              await job.log(`${infoHash}: Downloaded files are valid`);

              return {
                plugin: pluginName,
                result: {
                  torrentId: pluginDownloadResult.torrentId,
                  infoHash,
                  files: validatedFiles,
                  provider,
                },
              };
            } catch (error) {
              if (error instanceof InvalidTorrentError) {
                throw error;
              }

              logger.debug(
                `${mediaItem.type} ${mediaItem.fullTitle} (${mediaItem.id}) - ${String(error)}`,
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

      logger.debug(
        `Info hash ${chalk.bold(infoHash)} failed validation for all plugins for ${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)}`,
      );

      await job.log(`${infoHash} failed validation for all plugins`);

      await job.updateData({
        ...job.data,
        failedInfoHashes: [...failedInfoHashes, infoHash],
      });
    }

    return null;
  });

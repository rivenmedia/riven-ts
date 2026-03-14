import { type ParentOptions, UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { findValidTorrentProcessorSchema } from "./find-valid-torrent.schema.ts";
import { getCachedTorrentFiles } from "./utilities/get-cached-torrent-files.ts";
import { getPluginDownloadResult } from "./utilities/get-plugin-download-result.ts";
import { getPluginProviderList } from "./utilities/get-plugin-provider-list.ts";
import { getValidTorrentFiles } from "./utilities/get-valid-torrent-files.ts";
import { InvalidTorrentError } from "./utilities/validate-torrent-files.ts";

export const findValidTorrentProcessor =
  findValidTorrentProcessorSchema.implementAsync(async function ({ job }) {
    const [rankedStreams] = Object.values(await job.getChildrenValues());

    if (!rankedStreams?.length) {
      throw new UnrecoverableError(
        `No streams found that match the ranking criteria for ${job.data.itemTitle}`,
      );
    }

    const {
      id: jobId,
      data: { availableDownloaders, id: mediaItemId, failedInfoHashes },
    } = job;

    assert(jobId);

    const mediaItem = await database.mediaItem.findOneOrFail(mediaItemId);

    const infoHashes = rankedStreams.map((stream) => stream.hash);
    const uncheckedInfoHashes = new Set(infoHashes)
      .difference(new Set(failedInfoHashes))
      .values()
      .toArray();

    const jobParentOptions = {
      id: jobId,
      queue: job.queueQualifiedName,
    } satisfies ParentOptions;

    for (const infoHash of uncheckedInfoHashes) {
      for (const plugin of availableDownloaders) {
        try {
          const providers = plugin.hasProviderListHook
            ? await getPluginProviderList(plugin.pluginName, jobParentOptions)
            : [];

          do {
            const provider = providers.shift() ?? null;

            try {
              if (plugin.hasCacheCheckHook) {
                logger.debug(
                  `Checking for ${infoHash} in ${plugin.pluginName} cache${provider ? ` for ${provider}` : ""}...`,
                );

                const cachedFiles = await getCachedTorrentFiles(
                  plugin.pluginName,
                  infoHash,
                  jobParentOptions,
                  provider,
                );

                if (!cachedFiles) {
                  logger.verbose(
                    `${infoHash} is not immediately available on ${plugin.pluginName}${provider ? ` via ${provider}` : ""} for ${mediaItem.fullTitle}; skipping...`,
                  );

                  continue;
                }

                logger.verbose(
                  `Found ${infoHash} in ${plugin.pluginName} cache for ${mediaItem.fullTitle}${provider ? ` on ${provider}` : ""}`,
                );

                await getValidTorrentFiles(
                  mediaItem,
                  infoHash,
                  cachedFiles,
                  true,
                  jobParentOptions,
                );
              }

              const pluginDownloadResult = await getPluginDownloadResult(
                infoHash,
                plugin.pluginName,
                provider,
                jobParentOptions,
              );

              const validatedFiles = await getValidTorrentFiles(
                mediaItem,
                infoHash,
                pluginDownloadResult.files,
                false,
                jobParentOptions,
              );

              return {
                plugin: plugin.pluginName,
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
                `${mediaItem.type} ${mediaItem.fullTitle} (${mediaItem.id.toString()}) - ${String(error)}`,
              );

              continue;
            }
          } while (providers.length);
        } catch (error) {
          if (error instanceof InvalidTorrentError) {
            // If we receive a torrent validation error, it means we've actually checked its contents.
            // We can skip all processing of other providers & plugins, because the contents won't change.
            logger.debug(
              `Skipping all further processing of ${infoHash} due to failed files validation for ${mediaItem.fullTitle}`,
            );

            break;
          }

          throw error;
        }
      }

      logger.debug(
        `Info hash ${infoHash} failed validation for all plugins for ${mediaItem.type} ${mediaItem.fullTitle}`,
      );

      await job.updateData({
        ...job.data,
        failedInfoHashes: [...failedInfoHashes, infoHash],
      });
    }

    throw new UnrecoverableError(
      `No valid torrent found for ${mediaItem.fullTitle} after trying ${availableDownloaders.length.toString()} plugins`,
    );
  });

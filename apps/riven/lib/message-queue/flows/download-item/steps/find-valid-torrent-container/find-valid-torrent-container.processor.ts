import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { type ParentOptions, UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { runSingleJob } from "../../../../utilities/run-single-job.ts";
import { flow } from "../../../producer.ts";
import { enqueueMapItemsToFiles } from "../../enqueue-map-items-to-files.ts";
import { findValidTorrentContainerProcessorSchema } from "./find-valid-torrent-container.schema.ts";
import { getCachedTorrentFiles } from "./utilities/get-cached-torrent-files.ts";
import { getPluginProviderList } from "./utilities/get-plugin-provider-list.ts";
import { validateTorrentFiles } from "./utilities/validate-torrent-files.ts";

export const findValidTorrentContainerProcessor =
  findValidTorrentContainerProcessorSchema.implementAsync(async function ({
    job,
  }) {
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

    const jobParentOptions: ParentOptions = {
      id: jobId,
      queue: job.queueQualifiedName,
    };

    for (const infoHash of uncheckedInfoHashes) {
      for (const plugin of availableDownloaders) {
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

              const mapCacheItemsNode = await enqueueMapItemsToFiles({
                parent: jobParentOptions,
                infoHash,
                files: cachedFiles,
                jobId: `${infoHash}-map-items-to-files`,
              });

              const mappedCachedFiles = await runSingleJob(
                mapCacheItemsNode.job,
              );

              await validateTorrentFiles(
                mediaItem,
                infoHash,
                mappedCachedFiles,
                true,
              );
            }

            const pluginDownloadNode = await flow.addPluginJob(
              MediaItemDownloadRequestedEvent,
              MediaItemDownloadRequestedResponse,
              `Download ${infoHash}`,
              plugin.pluginName,
              { infoHash, provider },
              {
                jobId: [infoHash, plugin.pluginName, provider].join("-"),
                removeDependencyOnFailure: true,
                parent: jobParentOptions,
              },
            );

            const pluginDownloadResult = await runSingleJob(
              pluginDownloadNode.job,
            );

            const mapItemsToFilesJobNode = await enqueueMapItemsToFiles({
              parent: jobParentOptions,
              infoHash,
              files: pluginDownloadResult.files,
              jobId: `${infoHash}-download`,
            });

            const mappedTorrentFiles = await runSingleJob(
              mapItemsToFilesJobNode.job,
            );

            const validatedFiles = await validateTorrentFiles(
              mediaItem,
              infoHash,
              mappedTorrentFiles,
              false,
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
            logger.debug(
              `${mediaItem.type} ${mediaItem.fullTitle} (${mediaItem.id.toString()}) - ${String(error)}`,
            );

            continue;
          }
        } while (providers.length);
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
      `No valid torrent container found for ${mediaItem.fullTitle} after trying ${availableDownloaders.length.toString()} plugins`,
    );
  });

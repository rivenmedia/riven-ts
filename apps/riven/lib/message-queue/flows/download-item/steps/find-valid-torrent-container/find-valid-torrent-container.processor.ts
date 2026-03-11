import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";
import {
  MediaItemDownloadCacheCheckRequestedEvent,
  MediaItemDownloadCacheCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download.cache-check-requested.event";

import { type ParentOptions, UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { runSingleJob } from "../../../../utilities/run-single-job.ts";
import { flow } from "../../../producer.ts";
import { enqueueMapItemsToFiles } from "../../enqueue-map-items-to-files.ts";
import { findValidTorrentContainerProcessorSchema } from "./find-valid-torrent-container.schema.ts";
import { validateCachedTorrentFiles } from "./utilities/validate-cached-torrent-files.ts";
import { validateTorrentFiles } from "./utilities/validate-torrent-files.ts";

import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

export const findValidTorrentContainerProcessor =
  findValidTorrentContainerProcessorSchema.implementAsync(async function ({
    job,
  }) {
    const [rankedStreams] = Object.values(await job.getChildrenValues());

    if (!rankedStreams?.length) {
      throw new UnrecoverableError(
        "No streams found that match the ranking criteria",
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

    for (const plugin of availableDownloaders) {
      const pluginCacheCheckNode = await flow.addPluginJob(
        MediaItemDownloadCacheCheckRequestedEvent,
        MediaItemDownloadCacheCheckRequestedResponse,
        `Check cache`,
        plugin.pluginName,
        { infoHashes: uncheckedInfoHashes },
        {
          jobId,
          removeDependencyOnFailure: true,
        },
      );

      const pluginCacheCheckResult = await runSingleJob(
        pluginCacheCheckNode.job,
      );

      const validCacheResults = pluginCacheCheckResult.reduce<
        Record<string, DebridFile[]>
      >((acc, val) => {
        if (val.status !== "cached") {
          return acc;
        }

        return {
          ...acc,
          [val.hash]: val.files,
        };
      }, {});

      for (const [infoHash, cacheResult] of Object.entries(validCacheResults)) {
        try {
          const mapCacheItemsNode = await enqueueMapItemsToFiles({
            parent: jobParentOptions,
            infoHash,
            files: cacheResult,
            jobId,
          });

          const mappedCachedFiles = await runSingleJob(mapCacheItemsNode.job);

          await validateCachedTorrentFiles(mediaItem, mappedCachedFiles);

          const pluginDownloadNode = await flow.addPluginJob(
            MediaItemDownloadRequestedEvent,
            MediaItemDownloadRequestedResponse,
            `Download ${infoHash}`,
            plugin.pluginName,
            { infoHash },
            {
              jobId,
              removeDependencyOnFailure: true,
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
          );

          return {
            plugin: plugin.pluginName,
            result: {
              torrentId: pluginDownloadResult.torrentId,
              infoHash,
              files: validatedFiles,
            },
          };
        } catch (error) {
          logger.debug(
            `${mediaItem.type} ${mediaItem.fullTitle} (${mediaItem.id.toString()}) - ${String(error)}`,
          );

          continue;
        }
      }

      // logger.debug(
      //   `Info hash ${infoHash} failed validation for all plugins for ${mediaItem.type} ${mediaItem.fullTitle}`,
      // );

      // await job.updateData({
      //   ...job.data,
      //   failedInfoHashes: [...failedInfoHashes, infoHash],
      // });
    }

    throw new UnrecoverableError(
      `No valid torrent container found for ${mediaItem.fullTitle} after trying ${availableDownloaders.length.toString()} plugins`,
    );
  });

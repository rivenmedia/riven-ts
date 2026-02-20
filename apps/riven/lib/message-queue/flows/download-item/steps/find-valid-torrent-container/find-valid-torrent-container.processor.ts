import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { runSingleJob } from "../../../../utilities/run-single-job.ts";
import { flow } from "../../../producer.ts";
import { findValidTorrentContainerProcessorSchema } from "./find-valid-torrent-container.schema.ts";
import { validateTorrentContainer } from "./utilities/validate-torrent-container.ts";

export const findValidTorrentContainerProcessor =
  findValidTorrentContainerProcessorSchema.implementAsync(async function ({
    job,
  }) {
    const {
      id: jobId,
      data: {
        availableDownloaders,
        id: mediaItemId,
        infoHashes,
        failedInfoHashes,
      },
    } = job;

    assert(jobId);

    const mediaItem = await database.mediaItem.findOneOrFail(mediaItemId, {
      populate: ["streams"],
    });

    const uncheckedInfoHashes = new Set(infoHashes)
      .difference(new Set(failedInfoHashes))
      .values()
      .toArray();

    for (const infoHash of uncheckedInfoHashes) {
      for (const plugin of availableDownloaders) {
        const node = await flow.addPluginJob(
          MediaItemDownloadRequestedEvent,
          MediaItemDownloadRequestedResponse,
          `Download ${mediaItem.title}`,
          plugin,
          { item: mediaItem },
          {
            parent: {
              id: jobId,
              queue: job.queueQualifiedName,
            },
          },
        );

        try {
          const result = await runSingleJob(node.job);
          const isContainerValid = validateTorrentContainer(mediaItem, result);

          return {
            success: true,
            result: {
              plugin,
              result,
            },
          };
        } catch (error) {
          logger.warn(
            `Invalid info hash: ${infoHash} from plugin ${plugin} for media item ${mediaItem.title} (${mediaItem.id.toString()}) - ${String(error)}`,
          );

          await job.updateData({
            ...job.data,
            failedInfoHashes: [...failedInfoHashes, infoHash],
          });

          continue;
        }
      }
    }

    throw new UnrecoverableError(
      `No valid torrent container found for ${mediaItem.title} after trying ${availableDownloaders.length.toString()} plugins`,
    );
  });

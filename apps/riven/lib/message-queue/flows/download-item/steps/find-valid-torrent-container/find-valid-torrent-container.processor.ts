import { UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { runSingleJob } from "../../../../utilities/run-single-job.ts";
import { enqueueMapItemsToFiles } from "../../enqueue-map-items-to-files.ts";
import { findValidTorrentContainerProcessorSchema } from "./find-valid-torrent-container.schema.ts";
import { validateTorrentContainer } from "./utilities/validate-torrent-container.ts";

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

    for (const infoHash of uncheckedInfoHashes) {
      for (const plugin of availableDownloaders) {
        try {
          const mapItemsToFilesJobNode = await enqueueMapItemsToFiles({
            parent: { id: jobId, queue: job.queueQualifiedName },
            infoHash,
            plugin,
          });

          const mappedTorrentContainer = await runSingleJob(
            mapItemsToFilesJobNode.job,
          );

          const validatedFiles = await validateTorrentContainer(
            mediaItem,
            infoHash,
            mappedTorrentContainer,
          );

          return {
            plugin,
            result: {
              ...mappedTorrentContainer,
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

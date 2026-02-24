import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
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
        const node = await flow.addPluginJob(
          MediaItemDownloadRequestedEvent,
          MediaItemDownloadRequestedResponse,
          `Download ${mediaItem.fullTitle}`,
          plugin,
          { infoHash },
          {
            ignoreDependencyOnFailure: true,
            parent: {
              id: jobId,
              queue: job.queueQualifiedName,
            },
          },
        );

        try {
          const result = await runSingleJob(node.job);

          return {
            plugin,
            result: await validateTorrentContainer(mediaItem, result),
          };
        } catch (error) {
          logger.warn(
            `${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)} (${chalk.bold(mediaItem.id.toString())}) - ${String(error)}`,
          );

          continue;
        }
      }

      logger.warn(
        `Info hash ${chalk.bold(infoHash)} failed validation for all plugins for ${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)} (${chalk.bold(mediaItem.id.toString())})`,
      );

      await job.updateData({
        ...job.data,
        failedInfoHashes: [...failedInfoHashes, infoHash],
      });
    }

    throw new UnrecoverableError(
      `No valid torrent container found for ${chalk.bold(mediaItem.fullTitle)} after trying ${chalk.bold(availableDownloaders.length.toString())} plugins`,
    );
  });

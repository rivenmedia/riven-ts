import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { type PluginJobNode, UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { runSingleJob } from "../../../../utilities/run-single-job.ts";
import { flow } from "../../../producer.ts";
import {
  type ParseDownloadResultsFlow,
  createParseDownloadResultsJob,
} from "../parse-download-results/parse-download-results.schema.ts";
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
          const pluginDownloadNode = await flow.addPluginJob(
            MediaItemDownloadRequestedEvent,
            MediaItemDownloadRequestedResponse,
            `Download ${infoHash}`,
            plugin,
            { infoHash },
            {
              jobId: infoHash, // Use info hash as job ID to prevent duplicate processing of the same torrent container
              ignoreDependencyOnFailure: true,
              parent: {
                id: jobId,
                queue: job.queueQualifiedName,
              },
            },
          );

          const torrentContainer = await runSingleJob(pluginDownloadNode.job);

          const parsedTorrentContainerNode: PluginJobNode<
            ParseDownloadResultsFlow["input"],
            ParseDownloadResultsFlow["output"]
          > = await flow.add(
            createParseDownloadResultsJob(
              `Parse download results for ${infoHash}`,
              { results: torrentContainer },
              {
                opts: {
                  parent: {
                    id: jobId,
                    queue: job.queueQualifiedName,
                  },
                  removeOnFail: true,
                },
              },
            ),
          );

          const parsedTorrentContainer = await runSingleJob(
            parsedTorrentContainerNode.job,
          );

          const validatedFiles = await validateTorrentContainer(
            mediaItem,
            infoHash,
            parsedTorrentContainer,
          );

          return {
            plugin,
            result: {
              ...torrentContainer,
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

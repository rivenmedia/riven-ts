import { MediaItemDownloadRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { SerialisedMediaItem } from "../../../../../utilities/serialisers/serialised-media-item.ts";
import { createPluginFlowJob } from "../../../../utilities/create-flow-plugin-job.ts";
import { zipFlowChildrenResults } from "../../../../utilities/zip-children-results.ts";
import { flow } from "../../../producer.ts";
import { findValidTorrentContainerProcessorSchema } from "./find-valid-torrent-container.schema.ts";
import { validateTorrentContainer } from "./utilities/validate-torrent-container.ts";

export const findValidTorrentContainerProcessor =
  findValidTorrentContainerProcessorSchema.implementAsync(async function (job) {
    const {
      id: jobId,
      data: { availableDownloaders, id: mediaItemId },
    } = job;

    assert(jobId);

    const mediaItem = await database.mediaItem.findOneOrFail(mediaItemId, {
      populate: ["streams"],
    });

    for (const { infoHash } of mediaItem.streams) {
      for (const plugin of availableDownloaders) {
        await flow.add(
          createPluginFlowJob(
            MediaItemDownloadRequestedEvent,
            `Download ${mediaItem.title} from ${plugin}`,
            plugin,
            { item: mediaItem },
            {
              parent: {
                id: jobId,
                queue: job.queueQualifiedName,
              },
            },
          ),
        );

        const [finalResult] = zipFlowChildrenResults(
          await job.getChildrenValues(),
        );

        if (!finalResult) {
          logger.warn(
            `No result returned from downloader plugin ${plugin} for ${mediaItem.type} "${mediaItem.title}"`,
          );

          continue;
        }

        const isContainerValid = validateTorrentContainer(
          mediaItem,
          finalResult.result,
        );

        return {
          success: true,
          result: finalResult,
        };
      }
    }

    throw new UnrecoverableError(
      `No valid torrent container found for ${mediaItem.title} after trying ${availableDownloaders.length.toString()} plugins`,
    );
  });

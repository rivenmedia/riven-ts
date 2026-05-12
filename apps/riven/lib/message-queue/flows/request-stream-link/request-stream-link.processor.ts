import {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";

import { UnrecoverableError, WaitingChildrenError } from "bullmq";
import chalk from "chalk";
import assert from "node:assert";

import { logger } from "../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { enqueueProcessMediaItem } from "../process-media-item/enqueue-process-media-item.ts";
import { flow } from "../producer.ts";
import { requestStreamLinkProcessorSchema } from "./request-stream-link.schema.ts";

export const requestStreamLinkProcessor =
  requestStreamLinkProcessorSchema.implementAsync(
    async (
      { job, token },
      { services: { streamService, mediaEntryService, mediaItemService } },
    ) => {
      assert(token, "Token is required to create child jobs");

      const { mediaEntry } = job.data;

      while (job.data.step !== "complete") {
        switch (job.data.step) {
          case "request-stream-link": {
            const mediaEntryEntity = await mediaEntryService.getMediaEntry(
              mediaEntry.id,
            );

            await flow.addPluginJob(
              MediaItemStreamLinkRequestedEvent,
              MediaItemStreamLinkRequestedResponse,
              `Request stream link: ${mediaEntry.id}`,
              mediaEntry.plugin,
              { item: mediaEntryEntity },
              {
                parent: createJobParentConfig(job),
                ignoreDependencyOnFailure: true,
              },
            );

            await job.updateData({
              ...job.data,
              step: "validate-response",
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "validate-response": {
            const [response] = Object.values(await job.getChildrenValues());

            if (!response) {
              throw new UnrecoverableError(
                "Failed to get response from stream link request job",
              );
            }

            const isDeadLink = streamService.isFatalStatusCode(
              response.statusCode,
            );

            if (isDeadLink) {
              await job.updateData({
                ...job.data,
                step: "blacklist-stream",
              });

              break;
            }

            if (response.link === null) {
              logger.warn(
                `Received invalid stream link response for ${mediaEntry.originalFilename}, retrying request...`,
              );

              await job.updateData({
                ...job.data,
                step: "request-stream-link",
              });

              break;
            }

            await job.updateData({
              ...job.data,
              step: "save-stream-link",
              link: response.link,
            });

            break;
          }
          case "save-stream-link": {
            assert(
              job.data.link,
              "Stream link is required to save to media entry",
            );

            await streamService.saveStreamUrl(mediaEntry.id, job.data.link);

            await job.updateData({
              ...job.data,
              step: "complete",
            });

            break;
          }
          case "blacklist-stream": {
            logger.warn(
              `Blacklisting stream for ${chalk.bold(mediaEntry.originalFilename)}; dead torrent detected`,
            );

            const mediaItem = await mediaItemService.getMediaItem(
              mediaEntry.mediaItem,
            );

            await streamService.blacklistActiveStream({
              mediaItem,
              provider: mediaEntry.plugin,
              plugin: mediaEntry.plugin,
            });

            logger.info(
              `Stream for ${chalk.bold(mediaEntry.originalFilename)} has been blacklisted`,
            );

            await enqueueProcessMediaItem({
              id: mediaItem.id,
              step: "download",
            });

            throw new UnrecoverableError(
              `Active stream for ${mediaEntry.originalFilename} has been blacklisted due to dead torrent; re-processing media item for download`,
            );
          }
        }
      }

      assert(
        job.data.link,
        "No stream URL found after processing stream link request",
      );

      return {
        link: job.data.link,
      };
    },
  );

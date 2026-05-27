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

      const mediaEntry = await mediaEntryService.getMediaEntryById(
        job.data.mediaEntryId,
      );

      while (job.data.step !== "complete") {
        switch (job.data.step) {
          case "request-stream-link": {
            const mediaEntryEntity = await mediaEntryService.getMediaEntryById(
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

            assert(
              response,
              new UnrecoverableError(
                `Failed to get response from plugin job for ${mediaEntry.path}`,
              ),
            );

            if (!response.success) {
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

              throw new UnrecoverableError(
                `Plugin failed to generate stream link for ${mediaEntry.path} with status code ${response.statusCode.toString()}`,
              );
            }

            await job.updateData({
              ...job.data,
              step: "save-stream-link",
              link: response.data.link,
            });

            break;
          }
          case "save-stream-link": {
            assert(
              job.data.link,
              new UnrecoverableError(
                "Stream link is required to save to media entry",
              ),
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

            const mediaItem = await mediaItemService.getMediaItemById(
              mediaEntry.mediaItem.id,
              { populate: ["filesystemEntries:ref"] },
            );

            try {
              const { blacklistedItems, infoHash: blacklistedInfoHash } =
                await streamService.blacklistActiveStream({
                  mediaItem,
                  provider: mediaEntry.provider,
                  plugin: mediaEntry.plugin,
                });

              logger.info(
                `Stream ${blacklistedInfoHash} for ${chalk.bold(mediaEntry.originalFilename)} has been blacklisted`,
              );

              const itemsToReprocess =
                await streamService.calculateItemsToReprocess(
                  new Set(blacklistedItems),
                );

              for (const item of itemsToReprocess) {
                await enqueueProcessMediaItem({ id: item.id });
              }

              throw new UnrecoverableError(
                `Dead torrent detected for ${mediaEntry.originalFilename} (${blacklistedInfoHash}). Attempting to download another hash...`,
              );
            } catch (error) {
              if (error instanceof UnrecoverableError) {
                throw error;
              }

              throw new UnrecoverableError(
                `Failed to blacklist stream for ${mediaEntry.originalFilename}: ${String(error)}`,
              );
            }
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

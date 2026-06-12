import {
  MediaItemStreamLinkHealthCheckRequestedEvent,
  MediaItemStreamLinkHealthCheckRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-health-check-requested.event";
import {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";

import { UnrecoverableError, WaitingChildrenError } from "bullmq";
import chalk from "chalk";
import { DateTime, Duration } from "luxon";
import assert from "node:assert";
import z from "zod";

import { logger } from "../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { filterChildrenValues } from "../../utilities/filter-children-values.ts";
import { enqueueProcessMediaItem } from "../process-media-item/enqueue-process-media-item.ts";
import { flow } from "../producer.ts";
import { requestStreamLinkProcessorSchema } from "./request-stream-link.schema.ts";
import { getHealthCheckNextStep } from "./utilities/get-health-check-next-step.ts";

export const requestStreamLinkProcessor =
  requestStreamLinkProcessorSchema.implementAsync(
    async (
      { job, token },
      { services: { streamService, mediaEntryService } },
    ) => {
      assert(token, "Token is required to create child jobs");

      const mediaEntry = await mediaEntryService.getMediaEntryById(
        job.data.mediaEntryId,
        { populate: ["mediaItem.fullTitle"] },
      );

      while (job.data.step !== "complete") {
        switch (job.data.step) {
          case "request-stream-link": {
            const cachedStreamLink = await streamService.getStreamLink(
              mediaEntry.id,
            );

            if (cachedStreamLink) {
              logger.debug(
                `Returning cached stream link for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)}`,
              );

              return cachedStreamLink;
            }

            if (mediaEntry.streamPermalink) {
              // Don't re-request links if we already have a permalink,
              // just check the permalink is still healthy
              await job.updateData({
                ...job.data,
                step: "check-link-health",
                linkData: {
                  link: mediaEntry.streamPermalink,
                  isPermalink: true,
                },
              });

              break;
            }

            const streamLinkRequestedNode = await flow.addPluginJob(
              MediaItemStreamLinkRequestedEvent,
              MediaItemStreamLinkRequestedResponse,
              `Request stream link: ${mediaEntry.id}`,
              mediaEntry.plugin,
              { item: mediaEntry },
              {
                parent: createJobParentConfig(job),
                ignoreDependencyOnFailure: true,
              },
            );

            await job.updateData({
              ...job.data,
              step: "process-stream-link-response",
              streamLinkRequestedJobId: streamLinkRequestedNode.job.id,
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "process-stream-link-response": {
            const { success, data, error } =
              MediaItemStreamLinkRequestedResponse.safeParse(
                filterChildrenValues(
                  await job.getChildrenValues(),
                  "riven.media-item.stream-link.requested",
                  mediaEntry.plugin,
                  job.data.streamLinkRequestedJobId,
                ),
              );

            if (!success) {
              throw new UnrecoverableError(
                `Failed to get response from plugin job for ${mediaEntry.path}: ${z.prettifyError(error)}`,
              );
            }

            if (!data.success) {
              const isDeadLink = streamService.isFatalStatusCode(
                data.statusCode,
              );

              if (isDeadLink) {
                await job.updateData({
                  ...job.data,
                  step: "blacklist-stream",
                });

                break;
              }

              throw new UnrecoverableError(
                `Plugin failed to generate stream link for ${mediaEntry.path} with status code ${data.statusCode.toString()}`,
              );
            }

            const { data: linkData } = data;

            await job.updateData({
              ...job.data,
              step: "check-link-health",
              linkData,
            });

            break;
          }
          case "check-link-health": {
            assert(
              job.data.linkData,
              new UnrecoverableError(
                "Stream link data is required to check link health",
              ),
            );

            const healthCheckJobNode = await flow.addPluginJob(
              MediaItemStreamLinkHealthCheckRequestedEvent,
              MediaItemStreamLinkHealthCheckRequestedResponse,
              `Stream URL health check for ${mediaEntry.mediaItem.$.fullTitle}`,
              mediaEntry.plugin,
              {
                item: mediaEntry,
                link: job.data.linkData.link,
              },
              {
                parent: createJobParentConfig(job),
                ignoreDependencyOnFailure: true,
              },
            );

            await job.updateData({
              ...job.data,
              step: "process-health-check-response",
              healthCheckJobId: healthCheckJobNode.job.id,
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "process-health-check-response": {
            const { success, data, error } =
              MediaItemStreamLinkHealthCheckRequestedResponse.safeParse(
                filterChildrenValues(
                  await job.getChildrenValues(),
                  "riven.media-item.stream-link.health-check.requested",
                  mediaEntry.plugin,
                  job.data.healthCheckJobId,
                ),
              );

            if (!success) {
              throw new UnrecoverableError(
                `Failed to get health check response from plugin job for ${mediaEntry.path}: ${z.prettifyError(error)}`,
              );
            }

            const nextStep = getHealthCheckNextStep(data.state);

            switch (data.state) {
              case "healthy": {
                logger.debug(
                  `Stream URL for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)} is healthy with status code ${data.statusCode.toString()}`,
                );

                break;
              }
              case "expired": {
                logger.warn(
                  `Stream URL for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)} has expired, attempting to fetch a new stream URL...`,
                );

                if (mediaEntry.streamPermalink) {
                  await streamService.clearStreamPermalink(mediaEntry.id);
                }

                break;
              }
            }

            await job.updateData({
              ...job.data,
              step: nextStep,
            });

            break;
          }
          case "save-healthy-link": {
            assert(
              job.data.linkData,
              new UnrecoverableError(
                "Stream link data is required to save to media entry",
              ),
            );

            if (job.data.linkData.isPermalink) {
              await streamService.saveStreamPermalink(
                mediaEntry.id,
                job.data.linkData.link,
              );
            }

            const ttl = !job.data.linkData.isPermalink
              ? DateTime.fromISO(job.data.linkData.expiresAt).diffNow()
              : Duration.fromObject({ hours: 3 });

            await streamService.saveStreamLink(
              mediaEntry.id,
              job.data.linkData.link,
              Math.min(ttl.as("seconds"), 60),
            );

            logger.debug(
              `Cached stream link for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)} for ${ttl.shiftTo("hours").toHuman()}`,
            );

            await job.updateData({
              ...job.data,
              step: "complete",
            });

            break;
          }
          case "blacklist-stream": {
            logger.warn(
              `Dead torrent detected. Blacklisting stream for ${chalk.bold(mediaEntry.originalFilename)}`,
            );

            try {
              const mediaItem = await mediaEntry.mediaItem.loadOrFail({
                populate: ["filesystemEntries:ref"],
              });

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
        job.data.linkData,
        "No stream URL found after processing stream link request",
      );

      return job.data.linkData.link;
    },
  );

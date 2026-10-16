import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";
import {
  MediaItemIndexRequestedMovieEvent,
  MediaItemIndexRequestedShowEvent,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { NotFoundError } from "@mikro-orm/core";
import { DelayedError, UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { flow } from "#message-queue/flows/producer.ts";
import { createPluginFlowJob } from "#message-queue/utilities/create-flow-plugin-job.ts";
import { createJobParentConfig } from "#message-queue/utilities/create-job-parent-config.ts";
import { maybeWaitForChildren } from "#message-queue/utilities/maybe-wait-for-children.ts";
import { getPluginEventSubscribers } from "#state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";

import { processItemRequestProcessorSchema } from "./process-item-request.schema.ts";
import { clearProcessingJobs } from "./utilities/clear-processing-jobs.ts";
import { mergeIndexerResults } from "./utilities/merge-indexer-results.ts";

export const processItemRequestProcessor =
  processItemRequestProcessorSchema.implementAsync(
    async (
      { job, token },
      {
        sendEvent,
        services: { mediaItemService, itemRequestService, indexerService },
        plugins,
      },
    ) => {
      try {
        // Ensure the item request exists before proceeding
        await itemRequestService.getItemRequestById(job.data.itemRequestId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new UnrecoverableError(
            `Item request with ID ${job.data.itemRequestId} not found`,
          );
        }

        throw error;
      }

      switch (job.data.step) {
        case "request": {
          assert.ok(token, "Token is required to create child jobs");

          const parent = createJobParentConfig(job);

          const itemRequest = await itemRequestService.getItemRequestById(
            job.data.itemRequestId,
          );

          const subscribers = getPluginEventSubscribers(
            `riven.media-item.index.requested.${itemRequest.type}`,
            plugins,
          );

          const childNodes = subscribers.map((plugin) =>
            createPluginFlowJob(
              itemRequest.type === "movie"
                ? MediaItemIndexRequestedMovieEvent
                : MediaItemIndexRequestedShowEvent,
              `Index ${itemRequest.externalIdsLabel.join(" | ")}`,
              plugin.name.description ?? "unknown",
              { item: itemRequest },
              {
                parent,
                ignoreDependencyOnFailure: true,
              },
            ),
          );

          await flow.addBulk(childNodes);

          await job.updateData({
            ...job.data,
            step: "process",
          });

          await maybeWaitForChildren(job, token);

          break;
        }
        case "process": {
          const data = await job.getChildrenValues();

          if (Object.values(data).filter(Boolean).length === 0) {
            const itemRequest = await itemRequestService.markAsFailed(
              job.data.itemRequestId,
            );

            await job.moveToDelayed(
              DateTime.utc().plus({ days: 1 }).toMillis(),
            );

            throw new DelayedError(
              `Unable to index ${chalk.bold(itemRequest.externalIdsLabel.join(" | "))}. Retrying in 24 hours.`,
            );
          }

          const item = mergeIndexerResults(Object.values(data));

          try {
            const {
              item: updatedItem,
              isReindex,
              isAdditionalSeasonRequest = false,
            } = await indexerService.indexItem(item);

            const itemsToProcess = await mediaItemService.getItemsToProcess(
              updatedItem.id,
            );

            await clearProcessingJobs(itemsToProcess);

            sendEvent({
              type: "riven.media-item.index.success",
              item: updatedItem,
              meta:
                updatedItem instanceof Movie
                  ? {
                      type: "movie",
                      isReindex,
                    }
                  : {
                      type: "show",
                      isAdditionalSeasonRequest,
                      isReindex,
                    },
            });
          } catch (error) {
            if (
              error instanceof MediaItemIndexError ||
              error instanceof MediaItemIndexErrorIncorrectState
            ) {
              sendEvent(error.payload);

              throw new UnrecoverableError(
                `Failed to persist indexer data for ${item.title}: ${error.message}`,
              );
            }

            throw error;
          }
        }
      }
    },
  );

import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";
import {
  MediaItemIndexRequestedMovieEvent,
  MediaItemIndexRequestedShowEvent,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { DelayedError, UnrecoverableError, WaitingChildrenError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { queueRegistry } from "../../utilities/queue-registry.ts";
import { flow } from "../producer.ts";
import { processItemRequestProcessorSchema } from "./process-item-request.schema.ts";

import type {
  MediaItemIndexRequestedMovieResponse,
  MediaItemIndexRequestedShowResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export const processItemRequestProcessor =
  processItemRequestProcessorSchema.implementAsync(
    async (
      { job, token },
      { sendEvent, services: { itemRequestService, indexerService }, plugins },
    ) => {
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

          if (await job.moveToWaitingChildren(token)) {
            throw new WaitingChildrenError();
          }

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

          const item = {} as NonNullable<
            | MediaItemIndexRequestedMovieResponse
            | MediaItemIndexRequestedShowResponse
          >["item"];

          for (const value of Object.values(data)) {
            if (!value?.item) {
              continue;
            }

            Object.assign(item, value.item);
          }

          try {
            const updatedItem = await indexerService.indexItem(item);

            const queue = queueRegistry.get("process-media-item");

            if (!queue) {
              throw new Error(
                "Unable to find process-media-item queue in registry",
              );
            }

            const deduplicationId = await queue.getDeduplicationJobId(
              `process-${updatedItem.type}-${updatedItem.id}`,
            );

            if (deduplicationId) {
              logger.verbose(
                `Removing existing media item processing job for ${updatedItem.fullTitle}`,
              );

              const deduplicationFlow = await flow.getFlow({
                id: deduplicationId,
                queueName: "process-media-item",
              });

              await deduplicationFlow.job.remove();
            }

            sendEvent({
              type: "riven.media-item.index.success",
              item: updatedItem,
            });
          } catch (error) {
            if (
              error instanceof MediaItemIndexError ||
              error instanceof MediaItemIndexErrorIncorrectState
            ) {
              sendEvent(error.payload);

              throw new UnrecoverableError(
                `Failed to persist indexer data: ${error.message}`,
              );
            }

            throw error;
          }
        }
      }
    },
  );

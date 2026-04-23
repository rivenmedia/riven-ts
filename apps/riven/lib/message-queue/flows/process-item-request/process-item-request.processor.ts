import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";
import {
  MediaItemIndexRequestedMovieEvent,
  MediaItemIndexRequestedMovieResponse,
  MediaItemIndexRequestedShowEvent,
  MediaItemIndexRequestedShowResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { DelayedError, UnrecoverableError, WaitingChildrenError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { flow } from "../producer.ts";
import { processItemRequestProcessorSchema } from "./process-item-request.schema.ts";

export const processItemRequestProcessor =
  processItemRequestProcessorSchema.implementAsync(async function (
    { job, token },
    { sendEvent, services: { itemRequestService, indexerService }, plugins },
  ) {
    switch (job.data.step) {
      case "request": {
        assert(token, "Token is required to create child jobs");

        const parent = createJobParentConfig(job);

        const itemRequest = await itemRequestService.getItemRequest(
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

        await job.moveToWaitingChildren(token);

        throw new WaitingChildrenError();
      }
      case "process": {
        const data = await job.getChildrenValues();

        if (!Object.values(data).filter(Boolean).length) {
          const itemRequest = await itemRequestService.markAsFailed(
            job.data.itemRequestId,
          );

          await job.moveToDelayed(DateTime.utc().plus({ days: 1 }).toMillis());

          throw new DelayedError(
            `Unable to index ${chalk.bold(itemRequest.externalIdsLabel.join(" | "))}. Retrying in 24 hours.`,
          );
        }

        const item = Object.values(data).reduce(
          (acc, value) => {
            if (!value?.item) {
              return acc;
            }

            return Object.assign(acc, value.item);
          },
          {} as NonNullable<
            | MediaItemIndexRequestedMovieResponse
            | MediaItemIndexRequestedShowResponse
          >["item"],
        );

        try {
          const updatedItem = await indexerService.indexItem(item);

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
  });

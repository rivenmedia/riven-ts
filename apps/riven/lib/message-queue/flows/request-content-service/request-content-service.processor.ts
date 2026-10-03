import { ContentServiceRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import assert from "node:assert";

import { logger } from "../../../utilities/logger/logger.ts";
import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { waitForChildren } from "../../utilities/wait-for-children.ts";
import { flow } from "../producer.ts";
import { enqueueRequestContentService } from "./enqueue-request-content-service.ts";
import { requestContentServiceProcessorSchema } from "./request-content-service.schema.ts";

import type { ItemRequestService } from "../../../database/services/item-request/item-request.service.ts";
import type { MainRunnerMachineIntake } from "../../../state-machines/main-runner/index.ts";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

function buildExternalIdKey(
  /**
   * The primary external ID for the movie or show. This could be the TMDB ID for movies or the TVDB ID for shows.
   */
  primaryExternalKey: string | null | undefined,
  /**
   * The IMDB ID for the movie or show. This is used as a fallback if the primary external ID is not available.
   */
  imdbKey: string | null | undefined,
) {
  if (!primaryExternalKey && !imdbKey) {
    return null;
  }

  return primaryExternalKey ?? imdbKey;
}

type RequestedItem =
  | {
      item: ContentServiceRequestedResponse["movies"][number];
      type: "movie";
    }
  | {
      type: "show";
      item: ContentServiceRequestedResponse["shows"][number];
    };

/**
 * Collects the items returned by the content service into a map of unique items, keyed by external ID.
 */
function collectRequestedItems(
  childrenData: ContentServiceRequestedResponse[],
) {
  let updateIntervalSeconds: number | null = null;

  const items = new Map<string, RequestedItem>();

  for (const childData of childrenData) {
    updateIntervalSeconds ??= childData.updateIntervalSeconds;

    for (const movie of childData.movies) {
      const key = buildExternalIdKey(movie.tmdbId, movie.imdbId);

      if (!key) {
        logger.warn(
          `Skipping requested movie with no valid external ID: ${JSON.stringify(movie)}`,
        );

        continue;
      }

      items.set(key, { item: movie, type: "movie" });
    }

    for (const show of childData.shows) {
      const key = buildExternalIdKey(show.tvdbId, show.imdbId);

      if (!key) {
        logger.warn(
          `Skipping requested show with no valid external ID: ${JSON.stringify(show)}`,
        );

        continue;
      }

      items.set(key, { item: show, type: "show" });
    }
  }

  return { items, updateIntervalSeconds };
}

interface RequestItemsOptions {
  itemRequestService: ItemRequestService;
  sendEvent: MainRunnerMachineIntake;
  signal: AbortSignal | undefined;
}

async function requestItems(
  items: Iterable<RequestedItem>,
  { itemRequestService, sendEvent, signal }: RequestItemsOptions,
) {
  let newItemsCount = 0;
  let updatedItemsCount = 0;

  for (const { item, type } of items) {
    signal?.throwIfAborted();

    try {
      const result =
        type === "show"
          ? await itemRequestService.requestShow(item)
          : await itemRequestService.requestMovie(item);

      if (result.requestType === "create") {
        newItemsCount += 1;
      } else {
        updatedItemsCount += 1;
      }

      sendEvent({
        type: `riven.item-request.${result.requestType}.success`,
        item: result.item,
      });
    } catch (error) {
      if (
        error instanceof ItemRequestCreateError ||
        error instanceof ItemRequestCreateErrorConflict
      ) {
        sendEvent(error.payload);
      }
    }
  }

  return { newItemsCount, updatedItemsCount };
}

export const requestContentServiceProcessor =
  requestContentServiceProcessorSchema.implementAsync(
    async (
      { job, token, signal },
      { sendEvent, services: { itemRequestService } },
    ) => {
      assert.ok(token, "Token is required to create child jobs");

      const parent = createJobParentConfig(job);

      while (true) {
        switch (job.data.step) {
          case "request": {
            const childJob = createPluginFlowJob(
              ContentServiceRequestedEvent,
              "Request content service",
              job.data.contentServicePlugin,
              {},
              {
                parent,
                ignoreDependencyOnFailure: true,
              },
            );

            await flow.add(childJob);

            logger.silly(
              `Requesting content from ${job.data.contentServicePlugin}`,
            );

            await job.updateData({
              ...job.data,
              step: "process",
            });

            await waitForChildren(job, token);

            break;
          }
          case "process": {
            const data = await job.getChildrenValues();

            const { items, updateIntervalSeconds } = collectRequestedItems(
              Object.values(data),
            );

            const { newItemsCount, updatedItemsCount } = await requestItems(
              items.values(),
              { itemRequestService, sendEvent, signal },
            );

            if (updateIntervalSeconds) {
              await job.removeDeduplicationKey();
              await enqueueRequestContentService(
                job.data.contentServicePlugin,
                updateIntervalSeconds,
              );
            }

            return {
              count: items.size,
              newItems: newItemsCount,
              updatedItems: updatedItemsCount,
            };
          }
        }
      }
    },
  );

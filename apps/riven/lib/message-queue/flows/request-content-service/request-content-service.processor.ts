import {
  ContentServiceRequestedEvent,
  type ContentServiceRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { WaitingChildrenError } from "bullmq";
import assert from "node:assert";

import { logger } from "../../../utilities/logger/logger.ts";
import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { flow } from "../producer.ts";
import { enqueueRequestContentService } from "./enqueue-request-content-service.ts";
import { requestContentServiceProcessorSchema } from "./request-content-service.schema.ts";

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

export const requestContentServiceProcessor =
  requestContentServiceProcessorSchema.implementAsync(
    async (
      { job, token, signal },
      { sendEvent, services: { itemRequestService } },
    ) => {
      assert(token, "Token is required to create child jobs");

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

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "process": {
            const data = await job.getChildrenValues();

            const { items, updateIntervalSeconds } = Object.values(data).reduce(
              (acc, childData) => {
                acc.updateIntervalSeconds ??= childData.updateIntervalSeconds;

                if (childData.movies.length) {
                  for (const movie of childData.movies) {
                    const key = buildExternalIdKey(movie.tmdbId, movie.imdbId);

                    if (!key) {
                      logger.warn(
                        `Skipping requested movie with no valid external ID: ${JSON.stringify(movie)}`,
                      );

                      continue;
                    }

                    acc.items.set(key, { item: movie, type: "movie" });
                  }
                }

                if (childData.shows.length) {
                  for (const show of childData.shows) {
                    const key = buildExternalIdKey(show.tvdbId, show.imdbId);

                    if (!key) {
                      logger.warn(
                        `Skipping requested show with no valid external ID: ${JSON.stringify(show)}`,
                      );

                      continue;
                    }

                    acc.items.set(key, { item: show, type: "show" });
                  }
                }

                return acc;
              },
              {
                updateIntervalSeconds: null as number | null,
                items: new Map<
                  string,
                  | {
                      item: ContentServiceRequestedResponse["movies"][number];
                      type: "movie";
                    }
                  | {
                      type: "show";
                      item: ContentServiceRequestedResponse["shows"][number];
                    }
                >(),
              },
            );

            let newItemsCount = 0;
            let updatedItemsCount = 0;

            for (const { item, type } of items.values()) {
              signal?.throwIfAborted();

              try {
                const result =
                  type === "show"
                    ? await itemRequestService.requestShow(item)
                    : await itemRequestService.requestMovie(item);

                if (result.requestType === "create") {
                  newItemsCount++;
                } else {
                  updatedItemsCount++;
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

import {
  ContentServiceRequestedEvent,
  type ContentServiceRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { type ParentOptions, WaitingChildrenError } from "bullmq";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { requestContentServicesProcessorSchema } from "./request-content-services.schema.ts";

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

export const requestContentServicesProcessor =
  requestContentServicesProcessorSchema.implementAsync(
    async (
      { job, token },
      { sendEvent, services: { itemRequestService }, plugins },
    ) => {
      switch (job.data.step) {
        case "request": {
          assert(token, "Token is required to create child jobs");
          assert(job.id, "Job ID is required to create child jobs");

          const parent = {
            id: job.id,
            queue: job.queueQualifiedName,
          } satisfies ParentOptions;

          const subscribers = getPluginEventSubscribers(
            "riven.content-service.requested",
            plugins,
          );

          const childNodes = subscribers.map((plugin) =>
            createPluginFlowJob(
              ContentServiceRequestedEvent,
              "Request content service",
              plugin.name.description ?? "unknown",
              {},
              {
                parent,
                ignoreDependencyOnFailure: true,
              },
            ),
          );

          await flow.addBulk(childNodes);

          logger.silly(
            `Requesting content from ${subscribers.map((plugin) => plugin.name.description ?? "unknown").join(", ")}.`,
          );

          await job.updateData({
            ...job.data,
            step: "process",
          });

          await job.moveToWaitingChildren(token);

          throw new WaitingChildrenError();
        }
        case "process": {
          const data = await job.getChildrenValues();

          const items = Object.values(data).reduce((acc, childData) => {
            if (childData.movies.length) {
              for (const movie of childData.movies) {
                const key = buildExternalIdKey(movie.tmdbId, movie.imdbId);

                if (!key) {
                  logger.warn(
                    `Skipping requested movie with no valid external ID: ${JSON.stringify(movie)}`,
                  );

                  continue;
                }

                acc.set(key, { item: movie, type: "movie" });
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

                acc.set(key, { item: show, type: "show" });
              }
            }

            return acc;
          }, new Map<string, { item: ContentServiceRequestedResponse["movies" | "shows"][number]; type: "movie" | "show" }>());

          let newItemsCount = 0;
          let updatedItemsCount = 0;

          for (const { item, type } of items.values()) {
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

          return {
            count: items.size,
            newItems: newItemsCount,
            updatedItems: updatedItemsCount,
          };
        }
      }
    },
  );

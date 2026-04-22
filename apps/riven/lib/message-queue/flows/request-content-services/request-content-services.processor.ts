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
import { calculateRequestResults } from "./utilities/calculate-request-results.ts";

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

          const items = Object.values(
            data,
          ).reduce<ContentServiceRequestedResponse>(
            (acc, childData) => {
              if (childData.movies.length) {
                acc.movies.push(...childData.movies);
              }

              if (childData.shows.length) {
                acc.shows.push(...childData.shows);
              }

              return acc;
            },
            {
              movies: [],
              shows: [],
            },
          );

          const results = await Promise.allSettled([
            ...items.movies.map((item) =>
              itemRequestService.requestMovie(item),
            ),
            ...items.shows.map((item) => itemRequestService.requestShow(item)),
          ]);

          for (const result of results) {
            if (result.status === "fulfilled") {
              sendEvent({
                type: `riven.item-request.${result.value.requestType}.success`,
                item: result.value.item,
              });
            } else {
              if (
                result.reason instanceof ItemRequestCreateError ||
                result.reason instanceof ItemRequestCreateErrorConflict
              ) {
                sendEvent(result.reason.payload);
              }
            }
          }

          const { newItems, updatedItems } = calculateRequestResults(results);

          return {
            count: items.movies.length + items.shows.length,
            newItems,
            updatedItems,
          };
        }
      }
    },
  );

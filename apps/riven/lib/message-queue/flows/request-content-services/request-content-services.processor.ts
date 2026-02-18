import { ItemRequestCreationErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.conflict.event";
import { ItemRequestCreationError } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.event";

import { requestContentServicesProcessorSchema } from "./request-content-services.schema.ts";
import { processRequestedItem } from "./utilities/process-requested-item.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export const requestContentServicesProcessor =
  requestContentServicesProcessorSchema.implementAsync(
    async (job, sendEvent) => {
      const data = await job.getChildrenValues();

      const items = Object.values(data).reduce<ContentServiceRequestedResponse>(
        (acc, childData) => ({
          movies: acc.movies.concat(childData.movies),
          shows: acc.shows.concat(childData.shows),
        }),
        {
          movies: [],
          shows: [],
        },
      );

      const results = await Promise.allSettled([
        ...items.movies.map((item) =>
          processRequestedItem({
            item,
            type: "movie",
          }),
        ),
        ...items.shows.map((item) =>
          processRequestedItem({
            item,
            type: "show",
          }),
        ),
      ]);

      for (const result of results) {
        if (result.status === "rejected") {
          if (
            result.reason instanceof ItemRequestCreationError ||
            result.reason instanceof ItemRequestCreationErrorConflict
          ) {
            sendEvent(result.reason.payload);
          }
        } else {
          sendEvent({
            type: "riven.item-request.creation.success",
            item: result.value.item,
          });
        }
      }

      return {
        success: true,
        result: {
          count: items.movies.length + items.shows.length,
          newItems: results.filter(
            (result) => result.status === "fulfilled" && result.value.isNewItem,
          ).length,
        },
      };
    },
  );

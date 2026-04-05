import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { persistMovieItemRequest } from "../../../graphql/movies/mutations/persist-movie-item-request.ts";
import { persistRequestedShow } from "../../../graphql/shows/mutations/persist-requested-show.ts";
import { requestContentServicesProcessorSchema } from "./request-content-services.schema.ts";
import { calculateRequestResults } from "./utilities/calculate-request-results.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export const requestContentServicesProcessor =
  requestContentServicesProcessorSchema.implementAsync(
    async ({ job }, sendEvent) => {
      const data = await job.getChildrenValues();

      const items = Object.values(data).reduce<ContentServiceRequestedResponse>(
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
        ...items.movies.map((item) => persistMovieItemRequest(item)),
        ...items.shows.map((item) => persistRequestedShow(item)),
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
    },
  );

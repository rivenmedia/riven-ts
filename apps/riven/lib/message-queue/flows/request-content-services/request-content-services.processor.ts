import { processRequestedItem } from "../../../state-machines/main-runner/actors/process-requested-item.actor.ts";
import { requestContentServicesProcessorSchema } from "./request-content-services.schema.ts";

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
            item: {
              imdbId: item.imdbId,
              tmdbId: item.tmdbId,
            },
            sendEvent,
            type: "movie",
          }),
        ),
        ...items.shows.map((item) =>
          processRequestedItem({
            item: {
              imdbId: item.imdbId,
              tvdbId: item.tvdbId,
            },
            sendEvent,
            type: "show",
          }),
        ),
      ]);

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

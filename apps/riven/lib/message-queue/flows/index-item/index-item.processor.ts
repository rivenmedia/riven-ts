import { logger } from "@repo/core-util-logger";

import { UnrecoverableError } from "bullmq";

import { persistMovieIndexerData } from "../../../state-machines/main-runner/actors/persist-movie-indexer-data.actor.ts";
import { requestIndexDataProcessorSchema } from "./index-item.schema.ts";

import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export const indexItemProcessor =
  requestIndexDataProcessorSchema.implementAsync(
    async function (job, sendEvent) {
      const data = await job.getChildrenValues();

      if (!Object.keys(data).length) {
        throw new UnrecoverableError("No data returned from indexers");
      }

      const item = Object.values(data).reduce(
        (acc, { item }) => ({
          ...acc,
          ...item,
        }),
        {} as MediaItemIndexRequestedResponse["item"],
      );

      try {
        const updatedItem = await persistMovieIndexerData({
          item,
          sendEvent,
        });

        if (updatedItem) {
          sendEvent({
            type: "riven.media-item.index.success",
            item: updatedItem,
          });
        }

        return {
          success: true,
        };
      } catch (error: unknown) {
        logger.error(error);

        return {
          success: false,
          error,
        };
      }
    },
  );

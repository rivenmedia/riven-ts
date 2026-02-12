import { UnrecoverableError } from "bullmq";

import { persistMovieIndexerData } from "../../../state-machines/main-runner/actors/persist-movie-indexer-data.actor.ts";
import { persistShowIndexerData } from "../../../state-machines/main-runner/actors/persist-show-indexer-data.actor.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { requestIndexDataProcessorSchema } from "./index-item.schema.ts";

import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export const indexItemProcessor =
  requestIndexDataProcessorSchema.implementAsync(
    async function (job, sendEvent) {
      const data = await job.getChildrenValues();

      if (!Object.values(data).filter(Boolean).length) {
        throw new UnrecoverableError("No data returned from indexers");
      }

      const item = Object.values(data).reduce(
        (acc, value) => {
          if (!value?.item) {
            return acc;
          }

          return {
            ...acc,
            ...value.item,
          };
        },
        {} as NonNullable<MediaItemIndexRequestedResponse>["item"],
      );

      try {
        const updatedItem =
          item.type === "movie"
            ? await persistMovieIndexerData({
                item,
                sendEvent,
              })
            : await persistShowIndexerData({
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

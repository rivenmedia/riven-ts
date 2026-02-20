import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { UnrecoverableError } from "bullmq";

import { requestIndexDataProcessorSchema } from "./index-item.schema.ts";
import { persistMovieIndexerData } from "./utilities/persist-movie-indexer-data.ts";
import { persistShowIndexerData } from "./utilities/persist-show-indexer-data.ts";

import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export const indexItemProcessor =
  requestIndexDataProcessorSchema.implementAsync(async function (
    { job },
    sendEvent,
  ) {
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
          ? await persistMovieIndexerData({ item })
          : await persistShowIndexerData({ item });

      sendEvent({
        type: "riven.media-item.index.success",
        item: updatedItem,
      });

      return {
        success: true,
      };
    } catch (error) {
      if (
        error instanceof MediaItemIndexError ||
        error instanceof MediaItemIndexErrorIncorrectState
      ) {
        sendEvent(error.payload);

        throw new UnrecoverableError(
          `Failed to persist indexer data: ${String(error)}`,
        );
      }

      throw error;
    }
  });

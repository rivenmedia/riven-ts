import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a scrape has been requested for an indexed media item.
 */
export const MediaItemScrapeRequestedEvent = createProgramEventSchema(
  "media-item.scrape.requested",
  type({
    item: MediaItemInstance,
  }),
);

export type MediaItemScrapeRequestedEvent =
  typeof MediaItemScrapeRequestedEvent.infer;

export const MediaItemScrapeRequestedResponse = type({
  id: "number.integer >= 0",
  results: {
    "[string > 0]": "string > 0",
  },
});

export type MediaItemScrapeRequestedResponse =
  typeof MediaItemScrapeRequestedResponse.infer;

export const MediaItemScrapeRequestedEventHandler = createEventHandlerSchema(
  MediaItemScrapeRequestedEvent,
  MediaItemScrapeRequestedResponse,
);

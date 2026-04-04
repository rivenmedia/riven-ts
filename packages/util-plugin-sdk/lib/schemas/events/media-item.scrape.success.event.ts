import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully scraped.
 */
export const MediaItemScrapeSuccessEvent = createProgramEventSchema(
  "media-item.scrape.success",
  type({
    item: MediaItemInstance,
  }),
);

export type MediaItemScrapeSuccessEvent =
  typeof MediaItemScrapeSuccessEvent.infer;

export const MediaItemScrapeSuccessEventHandler = createEventHandlerSchema(
  MediaItemScrapeSuccessEvent,
);

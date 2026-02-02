import z from "zod";

import { MediaItem } from "../media/media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully scraped.
 */
export const MediaItemScrapeSuccessEvent = createProgramEventSchema(
  "media-item.scrape.success",
  z.object({
    item: MediaItem,
  }),
);

export type MediaItemScrapeSuccessEvent = z.infer<
  typeof MediaItemScrapeSuccessEvent
>;

export const MediaItemScrapeSuccessEventHandler = createEventHandlerSchema(
  MediaItemScrapeSuccessEvent,
);

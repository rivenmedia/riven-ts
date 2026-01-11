import z from "zod";

import { SerialisedMediaItem } from "../media-item/serialised-media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being scraped is in an incorrect state.
 */
export const MediaItemScrapeErrorIncorrectStateEvent = createProgramEventSchema(
  "media-item.scrape.error.incorrect-state",
  z.object({
    item: SerialisedMediaItem,
  }),
);

export type MediaItemScrapeErrorIncorrectStateEvent = z.infer<
  typeof MediaItemScrapeErrorIncorrectStateEvent
>;

export const MediaItemScrapeErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorIncorrectStateEvent);

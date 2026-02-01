import z from "zod";

import { MediaItem } from "../../dto/entities/index.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being scraped is in an incorrect state.
 */
export const MediaItemScrapeErrorIncorrectStateEvent = createProgramEventSchema(
  "media-item.scrape.error.incorrect-state",
  z.object({
    item: z.instanceof(MediaItem),
  }),
);

export type MediaItemScrapeErrorIncorrectStateEvent = z.infer<
  typeof MediaItemScrapeErrorIncorrectStateEvent
>;

export const MediaItemScrapeErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorIncorrectStateEvent);

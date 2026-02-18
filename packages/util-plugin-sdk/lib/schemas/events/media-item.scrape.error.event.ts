import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { MediaItemScrapeRequestedEvent } from "./media-item.scrape-requested.event.ts";

/**
 * Event emitted when there was an error persisting media item scrape data.
 */
export const MediaItemScrapeErrorEvent = createProgramEventSchema(
  "media-item.scrape.error",
  z.object({
    item: MediaItemScrapeRequestedEvent.shape.item,
    error: z.unknown(),
  }),
);

export type MediaItemScrapeErrorEvent = z.infer<
  typeof MediaItemScrapeErrorEvent
>;

export const MediaItemScrapeErrorEventHandler = createEventHandlerSchema(
  MediaItemScrapeErrorEvent,
);

export class MediaItemScrapeError extends createProgramEventError(
  MediaItemScrapeErrorEvent,
) {}

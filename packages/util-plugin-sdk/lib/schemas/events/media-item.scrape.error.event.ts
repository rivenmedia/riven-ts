import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "../utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { MediaItemScrapeRequestedEvent } from "./media-item.scrape-requested.event.ts";

/**
 * Event emitted when there was an error persisting media item scrape data.
 */
export const MediaItemScrapeErrorEvent = createProgramEventErrorSchema(
  "media-item.scrape",
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

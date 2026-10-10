import z from "zod";

import { MediaItemInstance } from "#schemas/media/media-item-instance.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "#schemas/utilities/create-program-event-schema.ts";
import { UUID } from "#schemas/utilities/uuid.schema.ts";

/**
 * Event emitted when a scrape has been requested for an indexed media item.
 */
export const MediaItemScrapeRequestedEvent = createProgramEventSchema(
  "media-item.scrape.requested",
  z.object({
    item: MediaItemInstance,
  }),
);

export type MediaItemScrapeRequestedEvent = z.infer<
  typeof MediaItemScrapeRequestedEvent
>;

export const MediaItemScrapeRequestedResponse = z.object({
  id: UUID,
  results: z.record(z.string(), z.string().nonempty()),
});

export type MediaItemScrapeRequestedResponse = z.infer<
  typeof MediaItemScrapeRequestedResponse
>;

export const MediaItemScrapeRequestedEventHandler = createEventHandlerSchema(
  MediaItemScrapeRequestedEvent,
  MediaItemScrapeRequestedResponse,
);

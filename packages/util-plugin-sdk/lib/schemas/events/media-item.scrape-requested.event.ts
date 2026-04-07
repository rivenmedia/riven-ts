import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a scrape has been requested for an indexed media item.
 */
export const MediaItemScrapeRequestedEvent = await createProgramEventSchema(
  "media-item.scrape.requested",
  async () => {
    const { MediaItemInstance } =
      await import("../media/media-item-instance.ts");

    return z.object({
      item: MediaItemInstance,
    });
  },
);

export type MediaItemScrapeRequestedEvent = z.infer<
  typeof MediaItemScrapeRequestedEvent
>;

export const MediaItemScrapeRequestedResponse = z.object({
  id: z.int(),
  results: z.record(z.string(), z.string().nonempty()),
});

export type MediaItemScrapeRequestedResponse = z.infer<
  typeof MediaItemScrapeRequestedResponse
>;

export const MediaItemScrapeRequestedEventHandler = createEventHandlerSchema(
  MediaItemScrapeRequestedEvent,
  MediaItemScrapeRequestedResponse,
);

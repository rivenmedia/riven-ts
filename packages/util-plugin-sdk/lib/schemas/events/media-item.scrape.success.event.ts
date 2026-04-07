import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully scraped.
 */
export const MediaItemScrapeSuccessEvent = await createProgramEventSchema(
  "media-item.scrape.success",
  async () => {
    const { MediaItemInstance } =
      await import("../media/media-item-instance.ts");

    return z.object({
      item: MediaItemInstance,
    });
  },
);

export type MediaItemScrapeSuccessEvent = z.infer<
  typeof MediaItemScrapeSuccessEvent
>;

export const MediaItemScrapeSuccessEventHandler = createEventHandlerSchema(
  MediaItemScrapeSuccessEvent,
);

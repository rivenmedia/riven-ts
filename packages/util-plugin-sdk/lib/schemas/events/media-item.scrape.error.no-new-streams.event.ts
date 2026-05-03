import z from "zod";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there were no new streams found while scraping a media item.
 */
export const MediaItemScrapeErrorNoNewStreamsEvent = createProgramEventSchema(
  "media-item.scrape.error.no-new-streams",
  z.object({
    item: MediaItemInstance,
    error: z.unknown(),
  }),
);

export type MediaItemScrapeErrorNoNewStreamsEvent = z.infer<
  typeof MediaItemScrapeErrorNoNewStreamsEvent
>;

export const MediaItemScrapeErrorNoNewStreamsEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorNoNewStreamsEvent);

export class MediaItemScrapeErrorNoNewStreams extends createProgramEventError(
  MediaItemScrapeErrorNoNewStreamsEvent,
) {}

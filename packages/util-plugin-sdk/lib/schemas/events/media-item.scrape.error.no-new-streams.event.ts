import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there were no new streams found while scraping a media item.
 */
export const MediaItemScrapeErrorNoNewStreamsEvent = createProgramEventSchema(
  "media-item.scrape.error.no-new-streams",
  type({
    item: MediaItemInstance,
  }),
);

export type MediaItemScrapeErrorNoNewStreamsEvent =
  typeof MediaItemScrapeErrorNoNewStreamsEvent.infer;

export const MediaItemScrapeErrorNoNewStreamsEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorNoNewStreamsEvent);

export class MediaItemScrapeErrorNoNewStreams extends createProgramEventError(
  MediaItemScrapeErrorNoNewStreamsEvent,
) {}

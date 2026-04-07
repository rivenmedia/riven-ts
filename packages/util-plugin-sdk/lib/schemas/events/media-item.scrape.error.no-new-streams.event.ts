import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there were no new streams found while scraping a media item.
 */
export const MediaItemScrapeErrorNoNewStreamsEvent =
  await createProgramEventSchema(
    "media-item.scrape.error.no-new-streams",
    async () => {
      const { MediaItemInstance } =
        await import("../media/media-item-instance.ts");

      return z.object({
        item: MediaItemInstance,
      });
    },
  );

export type MediaItemScrapeErrorNoNewStreamsEvent = z.infer<
  typeof MediaItemScrapeErrorNoNewStreamsEvent
>;

export const MediaItemScrapeErrorNoNewStreamsEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorNoNewStreamsEvent);

export class MediaItemScrapeErrorNoNewStreams extends createProgramEventError(
  MediaItemScrapeErrorNoNewStreamsEvent,
) {}

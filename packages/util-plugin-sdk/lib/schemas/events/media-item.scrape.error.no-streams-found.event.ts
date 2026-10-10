import z from "zod";

import { MediaItemInstance } from "#schemas/media/media-item-instance.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "#schemas/utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "#schemas/utilities/create-program-event-error.ts";

/**
 * Event emitted when there were no streams found while scraping a media item.
 */
export const MediaItemScrapeErrorNoStreamsFoundEvent =
  createProgramEventErrorSchema(
    ["media-item.scrape", "no-streams-found"],
    z.object({
      item: MediaItemInstance,
      error: z.unknown(),
    }),
  );

export type MediaItemScrapeErrorNoStreamsFoundEvent = z.infer<
  typeof MediaItemScrapeErrorNoStreamsFoundEvent
>;

export const MediaItemScrapeErrorNoStreamsFoundEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorNoStreamsFoundEvent);

export class MediaItemScrapeErrorNoStreamsFound extends createProgramEventError(
  MediaItemScrapeErrorNoStreamsFoundEvent,
) {}

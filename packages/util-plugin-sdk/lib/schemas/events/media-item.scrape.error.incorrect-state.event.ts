import z from "zod";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "../utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";

/**
 * Event emitted when a media item being scraped is in an incorrect state.
 */
export const MediaItemScrapeErrorIncorrectStateEvent =
  createProgramEventErrorSchema(
    ["media-item.scrape", "incorrect-state"],
    z.object({
      item: MediaItemInstance,
    }),
  );

export type MediaItemScrapeErrorIncorrectStateEvent = z.infer<
  typeof MediaItemScrapeErrorIncorrectStateEvent
>;

export const MediaItemScrapeErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorIncorrectStateEvent);

export class MediaItemScrapeErrorIncorrectState extends createProgramEventError(
  MediaItemScrapeErrorIncorrectStateEvent,
) {}

import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being scraped is in an incorrect state.
 */
export const MediaItemScrapeErrorIncorrectStateEvent = createProgramEventSchema(
  "media-item.scrape.error.incorrect-state",
  type({ item: MediaItemInstance }),
);

export type MediaItemScrapeErrorIncorrectStateEvent =
  typeof MediaItemScrapeErrorIncorrectStateEvent.infer;

export const MediaItemScrapeErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorIncorrectStateEvent);

export class MediaItemScrapeErrorIncorrectState extends createProgramEventError(
  MediaItemScrapeErrorIncorrectStateEvent,
) {}

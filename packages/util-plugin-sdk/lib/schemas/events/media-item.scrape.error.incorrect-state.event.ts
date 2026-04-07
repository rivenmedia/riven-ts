import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being scraped is in an incorrect state.
 */
export const MediaItemScrapeErrorIncorrectStateEvent =
  await createProgramEventSchema(
    "media-item.scrape.error.incorrect-state",
    async () => {
      const { MediaItemInstance } =
        await import("../media/media-item-instance.ts");

      return z.object({
        item: MediaItemInstance,
      });
    },
  );

export type MediaItemScrapeErrorIncorrectStateEvent = z.infer<
  typeof MediaItemScrapeErrorIncorrectStateEvent
>;

export const MediaItemScrapeErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemScrapeErrorIncorrectStateEvent);

export class MediaItemScrapeErrorIncorrectState extends createProgramEventError(
  MediaItemScrapeErrorIncorrectStateEvent,
) {}

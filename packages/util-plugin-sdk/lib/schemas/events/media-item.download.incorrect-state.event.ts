import z from "zod";

import { MediaItem } from "../media/media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being downloaded has already been downloaded.
 */
export const MediaItemDownloadErrorIncorrectStateEvent =
  createProgramEventSchema(
    "media-item.download.error.incorrect-state",
    z.object({
      item: MediaItem,
    }),
  );

export type MediaItemDownloadErrorIncorrectStateEvent = z.infer<
  typeof MediaItemDownloadErrorIncorrectStateEvent
>;

export const MediaItemDownloadErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemDownloadErrorIncorrectStateEvent);

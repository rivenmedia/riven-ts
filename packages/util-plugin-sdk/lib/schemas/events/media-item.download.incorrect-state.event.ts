import z from "zod";

import { MediaItemInstance } from "#schemas/media/media-item-instance.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "#schemas/utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "#schemas/utilities/create-program-event-error.ts";

/**
 * Event emitted when a media item being downloaded has already been downloaded.
 */
export const MediaItemDownloadErrorIncorrectStateEvent =
  createProgramEventErrorSchema(
    ["media-item.download", "incorrect-state"],
    z.object({
      item: MediaItemInstance,
    }),
  );

export type MediaItemDownloadErrorIncorrectStateEvent = z.infer<
  typeof MediaItemDownloadErrorIncorrectStateEvent
>;

export const MediaItemDownloadErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemDownloadErrorIncorrectStateEvent);

export class MediaItemDownloadErrorIncorrectState extends createProgramEventError(
  MediaItemDownloadErrorIncorrectStateEvent,
) {}

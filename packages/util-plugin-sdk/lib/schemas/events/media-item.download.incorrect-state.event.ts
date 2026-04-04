import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being downloaded has already been downloaded.
 */
export const MediaItemDownloadErrorIncorrectStateEvent =
  createProgramEventSchema(
    "media-item.download.error.incorrect-state",
    type({
      item: MediaItemInstance,
    }),
  );

export type MediaItemDownloadErrorIncorrectStateEvent =
  typeof MediaItemDownloadErrorIncorrectStateEvent.infer;

export const MediaItemDownloadErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemDownloadErrorIncorrectStateEvent);

export class MediaItemDownloadErrorIncorrectState extends createProgramEventError(
  MediaItemDownloadErrorIncorrectStateEvent,
) {}

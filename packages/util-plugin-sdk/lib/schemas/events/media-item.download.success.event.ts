import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully downloaded.
 */
export const MediaItemDownloadSuccessEvent = createProgramEventSchema(
  "media-item.download.success",
  type({
    item: MediaItemInstance,
    downloader: "string",
    durationFromRequestToDownload: "number > 0",
    provider: "string | null",
  }),
);

export type MediaItemDownloadSuccessEvent =
  typeof MediaItemDownloadSuccessEvent.infer;

export const MediaItemDownloadSuccessEventHandler = createEventHandlerSchema(
  MediaItemDownloadSuccessEvent,
);

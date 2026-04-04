import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a show or season has been partially downloaded.
 */
export const MediaItemDownloadPartialSuccessEvent = createProgramEventSchema(
  "media-item.download.partial-success",
  type({
    item: MediaItemInstance,
    downloader: "string",
  }),
);

export type MediaItemDownloadPartialSuccessEvent =
  typeof MediaItemDownloadPartialSuccessEvent.infer;

export const MediaItemDownloadPartialSuccessEventHandler =
  createEventHandlerSchema(MediaItemDownloadPartialSuccessEvent);

import z from "zod";

import { SerialisedMediaItem } from "../media-item/serialised-media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully downloaded.
 */
export const MediaItemDownloadSuccessEvent = createProgramEventSchema(
  "media-item.download.success",
  z.object({
    item: SerialisedMediaItem,
    durationFromRequestToDownload: z.number(),
  }),
);

export type MediaItemDownloadSuccessEvent = z.infer<
  typeof MediaItemDownloadSuccessEvent
>;

export const MediaItemDownloadSuccessEventHandler = createEventHandlerSchema(
  MediaItemDownloadSuccessEvent,
);

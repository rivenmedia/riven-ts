import z from "zod";

import { MediaItem } from "../../dto/entities/index.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully downloaded.
 */
export const MediaItemDownloadSuccessEvent = createProgramEventSchema(
  "media-item.download.success",
  z.object({
    item: z.instanceof(MediaItem),
    durationFromRequestToDownload: z.number(),
  }),
);

export type MediaItemDownloadSuccessEvent = z.infer<
  typeof MediaItemDownloadSuccessEvent
>;

export const MediaItemDownloadSuccessEventHandler = createEventHandlerSchema(
  MediaItemDownloadSuccessEvent,
);

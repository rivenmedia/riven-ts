import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully downloaded.
 */
export const MediaItemDownloadSuccessEvent = await createProgramEventSchema(
  "media-item.download.success",
  async () => {
    const { MediaItemInstance } =
      await import("../media/media-item-instance.ts");

    return z.object({
      item: MediaItemInstance,
      downloader: z.string(),
      durationFromRequestToDownload: z.number(),
      provider: z.string().nullable(),
    });
  },
);

export type MediaItemDownloadSuccessEvent = z.infer<
  typeof MediaItemDownloadSuccessEvent
>;

export const MediaItemDownloadSuccessEventHandler = createEventHandlerSchema(
  MediaItemDownloadSuccessEvent,
);

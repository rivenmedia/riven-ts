import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a show or season has been partially downloaded.
 */
export const MediaItemDownloadPartialSuccessEvent =
  await createProgramEventSchema(
    "media-item.download.partial-success",
    async () => {
      const { MediaItemInstance } =
        await import("../media/media-item-instance.ts");

      return z.object({
        item: MediaItemInstance,
        downloader: z.string(),
      });
    },
  );

export type MediaItemDownloadPartialSuccessEvent = z.infer<
  typeof MediaItemDownloadPartialSuccessEvent
>;

export const MediaItemDownloadPartialSuccessEventHandler =
  createEventHandlerSchema(MediaItemDownloadPartialSuccessEvent);

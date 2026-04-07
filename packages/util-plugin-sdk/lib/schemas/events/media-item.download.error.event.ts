import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item download fails.
 */
export const MediaItemDownloadErrorEvent = await createProgramEventSchema(
  "media-item.download.error",
  async () => {
    const { MediaItemInstance } =
      await import("../media/media-item-instance.ts");

    return z.object({
      item: MediaItemInstance,
      error: z.unknown(),
    });
  },
);

export type MediaItemDownloadErrorEvent = z.infer<
  typeof MediaItemDownloadErrorEvent
>;

export const MediaItemDownloadErrorEventHandler = createEventHandlerSchema(
  MediaItemDownloadErrorEvent,
);

export class MediaItemDownloadError extends createProgramEventError(
  MediaItemDownloadErrorEvent,
) {}

import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there was an error persisting media item index data.
 */
export const MediaItemIndexErrorEvent = await createProgramEventSchema(
  "media-item.index.error",
  async () => {
    const { ItemRequestInstance } = await import("../media/item-request.ts");

    return z.object({
      item: ItemRequestInstance,
      error: z.unknown(),
    });
  },
);

export type MediaItemIndexErrorEvent = z.infer<typeof MediaItemIndexErrorEvent>;

export const MediaItemIndexErrorEventHandler = createEventHandlerSchema(
  MediaItemIndexErrorEvent,
);

export class MediaItemIndexError extends createProgramEventError(
  MediaItemIndexErrorEvent,
) {}

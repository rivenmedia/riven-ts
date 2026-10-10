import z from "zod";

import { MovieInstance } from "#schemas/media/movie-instance.ts";
import { ShowInstance } from "#schemas/media/show-instance.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "#schemas/utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully indexed.
 */
export const MediaItemIndexSuccessEvent = createProgramEventSchema(
  "media-item.index.success",
  z.object({
    item: z.xor([MovieInstance, ShowInstance]),
    meta: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("movie"),
        isReindex: z.boolean().optional().default(false),
      }),
      z.object({
        type: z.literal("show"),
        isReindex: z.boolean().optional().default(false),
        isAdditionalSeasonRequest: z.boolean().optional().default(false),
      }),
    ]),
  }),
);

export type MediaItemIndexSuccessEvent = z.infer<
  typeof MediaItemIndexSuccessEvent
>;

export const MediaItemIndexSuccessEventHandler = createEventHandlerSchema(
  MediaItemIndexSuccessEvent,
);

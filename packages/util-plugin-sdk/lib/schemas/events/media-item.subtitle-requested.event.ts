import z from "zod";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when subtitles have been requested for a downloaded media item.
 */
export const MediaItemSubtitleRequestedEvent = createProgramEventSchema(
  "media-item.subtitle.requested",
  z.object({
    item: MediaItemInstance,
  }),
);

export type MediaItemSubtitleRequestedEvent = z.infer<
  typeof MediaItemSubtitleRequestedEvent
>;

export const SubtitleData = z.object({
  language: z.string().min(1),
  content: z.string().min(1),
  fileHash: z.string().min(1),
  fileSize: z.int().nonnegative(),
  sourceProvider: z.string().min(1),
  sourceId: z.string().optional(),
});

export type SubtitleData = z.infer<typeof SubtitleData>;

export const MediaItemSubtitleRequestedResponse = z.object({
  subtitles: z.array(SubtitleData),
});

export type MediaItemSubtitleRequestedResponse = z.infer<
  typeof MediaItemSubtitleRequestedResponse
>;

export const MediaItemSubtitleRequestedEventHandler = createEventHandlerSchema(
  MediaItemSubtitleRequestedEvent,
  MediaItemSubtitleRequestedResponse,
);

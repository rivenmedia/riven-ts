import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a list of supported providers is requested from a plugin.
 */
export const MediaItemDownloadProviderListRequestedEvent =
  createProgramEventSchema("media-item.download.provider-list-requested");

export type MediaItemDownloadProviderListRequestedEvent = z.infer<
  typeof MediaItemDownloadProviderListRequestedEvent
>;

export const MediaItemDownloadProviderListRequestedResponse = z.object({
  providers: z.array(z.string().min(1)).min(1),
});

export type MediaItemDownloadProviderListRequestedResponse = z.infer<
  typeof MediaItemDownloadProviderListRequestedResponse
>;

export const MediaItemDownloadProviderListRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemDownloadProviderListRequestedEvent,
    MediaItemDownloadProviderListRequestedResponse,
  );

import { type } from "arktype";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a list of supported providers is requested from a plugin.
 */
export const MediaItemDownloadProviderListRequestedEvent =
  createProgramEventSchema("media-item.download.provider-list-requested");

export type MediaItemDownloadProviderListRequestedEvent =
  typeof MediaItemDownloadProviderListRequestedEvent.infer;

export const MediaItemDownloadProviderListRequestedResponse = type({
  providers: "(string > 0)[] > 0",
});

export type MediaItemDownloadProviderListRequestedResponse =
  typeof MediaItemDownloadProviderListRequestedResponse.infer;

export const MediaItemDownloadProviderListRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemDownloadProviderListRequestedEvent,
    MediaItemDownloadProviderListRequestedResponse,
  );

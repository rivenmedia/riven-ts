import { type } from "arktype";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when content services have been requested.
 */
export const ContentServiceRequestedEvent = createProgramEventSchema(
  "content-service.requested",
);

export type ContentServiceRequestedEvent =
  typeof ContentServiceRequestedEvent.infer;

export const ContentServiceRequestedResponse = type({
  // TODO: at least one property required
  movies: ItemRequest.pick(
    "imdbId",
    "tmdbId",
    "externalRequestId",
    "requestedBy",
  ).array(),
  // TODO: at least one property required
  shows: ItemRequest.pick(
    "imdbId",
    "tvdbId",
    "externalRequestId",
    "requestedBy",
    "seasons",
  ).array(),
});

export type ContentServiceRequestedResponse =
  typeof ContentServiceRequestedResponse.infer;

export const ContentServiceRequestedEventHandler = createEventHandlerSchema(
  ContentServiceRequestedEvent,
  ContentServiceRequestedResponse,
);

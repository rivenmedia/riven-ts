import z from "zod";

import { atLeastOnePropertyRequired } from "../../validation/refinements/at-least-one-property-required.ts";
import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when content services have been requested.
 */
export const ContentServiceRequestedEvent = createProgramEventSchema(
  "content-service.requested",
);

export type ContentServiceRequestedEvent = z.infer<
  typeof ContentServiceRequestedEvent
>;

export const ContentServiceRequestedResponse = z.object({
  movies: z.array(
    ItemRequest.pick({
      imdbId: true,
      tmdbId: true,
      externalRequestId: true,
    }).refine(
      atLeastOnePropertyRequired,
      "At least one identifier is required",
    ),
  ),
  shows: z.array(
    ItemRequest.pick({
      imdbId: true,
      tvdbId: true,
      externalRequestId: true,
    }).refine(
      atLeastOnePropertyRequired,
      "At least one identifier is required",
    ),
  ),
});

export type ContentServiceRequestedResponse = z.infer<
  typeof ContentServiceRequestedResponse
>;

export const ContentServiceRequestedEventHandler = createEventHandlerSchema(
  ContentServiceRequestedEvent,
  ContentServiceRequestedResponse,
);

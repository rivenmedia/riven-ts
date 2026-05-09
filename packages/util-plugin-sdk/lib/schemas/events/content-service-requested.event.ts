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

const ExternalIdsSchema = ItemRequest.pick({
  imdbId: true,
  tvdbId: true,
  tmdbId: true,
}).refine(
  atLeastOnePropertyRequired,
  "At least one external ID (imdbId, tvdbId, or tmdbId) is required",
);

const BaseItemRequestData = ItemRequest.pick({
  externalRequestId: true,
  requestedBy: true,
});

export const ContentServiceRequestedResponse = z.object({
  movies: z.array(BaseItemRequestData.safeExtend(ExternalIdsSchema.shape)),
  shows: z.array(
    BaseItemRequestData.extend(
      ItemRequest.pick({ seasons: true }).shape,
    ).safeExtend(ExternalIdsSchema.shape),
  ),
  updateIntervalSeconds: z.int().nonnegative().nullable(),
});

export type ContentServiceRequestedResponse = z.infer<
  typeof ContentServiceRequestedResponse
>;

export const ContentServiceRequestedEventHandler = createEventHandlerSchema(
  ContentServiceRequestedEvent,
  ContentServiceRequestedResponse,
);

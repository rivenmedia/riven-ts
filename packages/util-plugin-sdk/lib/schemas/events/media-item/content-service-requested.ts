import z from "zod";

import { requestedItemSchema } from "../../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when content services have been requested.
 */
export const ContentServiceRequestedEvent = createProgramEventSchema(
  "content-service.requested",
);

export type ContentServiceRequestedEvent = z.infer<
  typeof ContentServiceRequestedEvent
>;

export const ContentServiceRequestedResponse = z.array(requestedItemSchema);

export type ContentServiceRequestedResponse = z.infer<
  typeof ContentServiceRequestedResponse
>;

export const ContentServiceRequestedEventHandler = createEventHandlerSchema(
  ContentServiceRequestedEvent,
  ContentServiceRequestedResponse,
);

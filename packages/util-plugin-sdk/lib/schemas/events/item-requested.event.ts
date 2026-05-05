import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { ContentServiceRequestedResponse } from "./content-service-requested.event.ts";

/**
 * Event emitted when a media item is requested.
 */
export const ItemRequestedEvent = createProgramEventSchema(
  "item-requested",
  z.object({
    item: z.discriminatedUnion("type", [
      ContentServiceRequestedResponse.shape.movies.element.extend({
        type: z.literal("movie"),
      }),
      ContentServiceRequestedResponse.shape.shows.element.extend({
        type: z.literal("show"),
      }),
    ]),
  }),
);

export type ItemRequestedEvent = z.infer<typeof ItemRequestedEvent>;

export const ItemRequestedEventHandler =
  createEventHandlerSchema(ItemRequestedEvent);

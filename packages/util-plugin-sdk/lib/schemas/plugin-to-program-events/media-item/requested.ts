import z from "zod";

import { requestedItemSchema } from "../../media-item/requested-item.ts";
import { createPluginEventSchema } from "../../utilities/create-plugin-event-schema.ts";

/**
 * Event emitted when a plugin has requested a new media item to be created.
 */
export const MediaItemRequestedEvent = createPluginEventSchema(
  "media-item.requested",
  z.object({
    item: requestedItemSchema,
  }),
);

export type MediaItemRequestedEvent = z.infer<typeof MediaItemRequestedEvent>;

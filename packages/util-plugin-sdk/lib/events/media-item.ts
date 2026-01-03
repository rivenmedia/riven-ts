import type { RequestedItem } from "../schemas/index.ts";
import type { PluginEvent, ProgramEvent } from "../types/events.ts";

/**
 * Event emitted when a plugin has requested a new media item to be created.
 */
export type MediaItemRequestedEvent = PluginEvent<
  "media-item.requested",
  { item: RequestedItem }
>;

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export type MediaItemCreatedEvent = ProgramEvent<
  "media-item.created",
  { item: RequestedItem }
>;

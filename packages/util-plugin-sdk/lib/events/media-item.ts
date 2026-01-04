import type { MediaItem } from "../dto/entities/index.ts";
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
export type MediaItemCreationSuccessEvent = ProgramEvent<
  "media-item.creation.success",
  { item: RequestedItem }
>;

/**
 * Event emitted when there was an error creating a media item from a requested item.
 */
export type MediaItemCreationErrorEvent = ProgramEvent<
  "media-item.creation.error",
  { item: RequestedItem; error: unknown }
>;

export type MediaItemCreationAlreadyExistsEvent = ProgramEvent<
  "media-item.creation.already-exists",
  { item: RequestedItem & Pick<MediaItem, "id" | "title"> }
>;

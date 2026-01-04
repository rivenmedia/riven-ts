import type {
  MediaItemCreationErrorEvent,
  MediaItemCreationSuccessEvent,
} from "./media-item.ts";
import type { StartupEvent } from "./program-lifecycle.ts";

export type ProgramToPluginEvent =
  | StartupEvent
  | MediaItemCreationSuccessEvent
  | MediaItemCreationErrorEvent;

import type { MediaItemCreatedEvent } from "./media-item.ts";
import type { StartupEvent } from "./program-lifecycle.ts";

export type ProgramToPluginEvent = StartupEvent | MediaItemCreatedEvent;

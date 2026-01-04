import type { ProgramEvent } from "../types/events.ts";

/**
 * Event emitted to trigger a retry of processing a media item.
 */
export type RetryLibraryEvent = ProgramEvent<"retry-library">;

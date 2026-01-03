import type { ProgramEvent } from "../types/events.ts";

/**
 * Event emitted when the program has started.
 */
export type StartupEvent = ProgramEvent<"started">;

/**
 * Event emitted when the program is shutting down.
 */
export type ShutdownEvent = ProgramEvent<"shutdown">;

/**
 * Event emitted when the program has exited.
 */
export type ExitedEvent = ProgramEvent<"exited">;

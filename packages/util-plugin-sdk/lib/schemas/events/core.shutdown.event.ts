import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when the program is shutting down.
 */
export const CoreShutdownEvent = createProgramEventSchema("core.shutdown");

export type CoreShutdownEvent = typeof CoreShutdownEvent.infer;

export const CoreShutdownEventHandler =
  createEventHandlerSchema(CoreShutdownEvent);

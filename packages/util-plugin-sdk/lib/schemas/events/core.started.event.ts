import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when the program has started.
 */
export const CoreStartedEvent = createProgramEventSchema(`core.started`);

export type CoreStartedEvent = typeof CoreStartedEvent.infer;

export const CoreStartedEventHandler =
  createEventHandlerSchema(CoreStartedEvent);

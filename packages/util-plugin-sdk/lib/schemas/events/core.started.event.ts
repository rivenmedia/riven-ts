import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "#schemas/utilities/create-program-event-schema.ts";

import type z from "zod";

/**
 * Event emitted when the program has started.
 */
export const CoreStartedEvent = createProgramEventSchema(`core.started`);

export type CoreStartedEvent = z.infer<typeof CoreStartedEvent>;

export const CoreStartedEventHandler =
  createEventHandlerSchema(CoreStartedEvent);

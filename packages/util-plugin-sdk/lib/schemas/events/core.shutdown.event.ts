import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

import type z from "zod";

/**
 * Event emitted when the program is shutting down.
 */
export const CoreShutdownEvent = createProgramEventSchema("core.shutdown");

export type CoreShutdownEvent = z.infer<typeof CoreShutdownEvent>;

export const CoreShutdownEventHandler =
  createEventHandlerSchema(CoreShutdownEvent);

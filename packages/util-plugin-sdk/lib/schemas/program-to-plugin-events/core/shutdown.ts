import type z from "zod";

import { createEventHandlerSchema } from "../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when the program is shutting down.
 */
export const ShutdownEvent = createProgramEventSchema("core.shutdown");

export type ShutdownEvent = z.infer<typeof ShutdownEvent>;

export const ShutdownEventHandler = createEventHandlerSchema(ShutdownEvent);

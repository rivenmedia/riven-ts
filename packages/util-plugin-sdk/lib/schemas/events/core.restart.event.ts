import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

import type z from "zod";

/**
 * Event emitted when the program is restarting.
 */
export const CoreRestartEvent = createProgramEventSchema("core.restart");

export type CoreRestartEvent = z.infer<typeof CoreRestartEvent>;

export const CoreRestartEventHandler =
  createEventHandlerSchema(CoreRestartEvent);

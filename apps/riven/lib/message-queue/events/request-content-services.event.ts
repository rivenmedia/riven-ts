import { createInternalEventSchema } from "../utilities/create-internal-event-schema.ts";

import type z from "zod";

export const RequestContentServicesEvent = createInternalEventSchema(
  "request-content-services",
);

export type RequestContentServicesEvent = z.infer<
  typeof RequestContentServicesEvent
>;

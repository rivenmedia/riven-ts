import { createInternalEventSchema } from "../utilities/create-internal-event-schema.ts";

export const RequestContentServicesEvent = createInternalEventSchema(
  "request-content-services",
);

export type RequestContentServicesEvent =
  typeof RequestContentServicesEvent.infer;

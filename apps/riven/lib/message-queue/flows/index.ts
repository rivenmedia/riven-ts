import { RequestIndexDataFlow } from "./indexing/indexing.schema.ts";
import { RequestContentServicesFlow } from "./request-content-services/request-content-services.schema.ts";

import type z from "zod";

export type Flow = RequestIndexDataFlow | RequestContentServicesFlow;

export const FlowHandlers = {
  indexing: RequestIndexDataFlow.shape.processor,
  "request-content-services": RequestContentServicesFlow.shape.processor,
} satisfies Record<Flow["name"], z.ZodFunction>;

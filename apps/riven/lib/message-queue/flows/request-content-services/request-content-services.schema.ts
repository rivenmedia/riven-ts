import { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

import z from "zod";

import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestContentServicesFlow = createFlowSchema(
  "request-content-services",
  ContentServiceRequestedResponse,
  z.object({
    count: z.number().nonnegative(),
    newItems: z.number().nonnegative(),
  }),
);

export type RequestContentServicesFlow = z.infer<
  typeof RequestContentServicesFlow
>;

export const requestContentServicesProcessorSchema =
  RequestContentServicesFlow.shape.processor;

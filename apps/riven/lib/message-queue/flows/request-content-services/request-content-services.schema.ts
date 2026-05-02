import { ContentServiceRequestedResponse } from "@rivenmedia/plugin-sdk/schemas/events/content-service-requested.event";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestType = z.enum(["create", "update"]);

export type RequestType = z.infer<typeof RequestType>;

export const RequestContentServicesFlow = createFlowSchema(
  "request-content-services",
  {
    children: ContentServiceRequestedResponse,
    input: z.object({
      step: z.enum(["request", "process"]),
    }),
    output: z.object({
      count: z.number().nonnegative(),
      newItems: z.number().nonnegative(),
      updatedItems: z.number().nonnegative(),
    }),
  },
);

export type RequestContentServicesFlow = z.infer<
  typeof RequestContentServicesFlow
>;

export const requestContentServicesProcessorSchema =
  RequestContentServicesFlow.shape.processor;

export const createRequestContentServicesJob = createFlowJobBuilder(
  RequestContentServicesFlow,
);

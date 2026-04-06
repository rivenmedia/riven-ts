import { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

import { registerEnumType } from "type-graphql";
import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestType = z.enum(["create", "update"]);

export type RequestType = z.infer<typeof RequestType>;

registerEnumType(RequestType.enum, {
  name: "RequestType",
  valuesConfig: {
    create: {
      description: "Indicates a new item request.",
    },
    update: {
      description: "Indicates an update to an existing item request.",
    },
  },
});

const RequestResult = z.object({
  new: z.number().nonnegative(),
  updated: z.number().nonnegative(),
});

export const RequestContentServicesFlow = createFlowSchema(
  "request-content-services",
  {
    children: ContentServiceRequestedResponse,
    output: z.object({
      count: z.number().nonnegative(),
      movies: RequestResult,
      shows: RequestResult,
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

import { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

import { type } from "arktype";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestType = type.enumerated("create", "update");

export type RequestType = typeof RequestType.infer;

export const RequestContentServicesFlow = createFlowSchema(
  "request-content-services",
  {
    children: ContentServiceRequestedResponse,
    output: type({
      count: "number.integer >= 0",
      newItems: "number.integer >= 0",
      updatedItems: "number.integer >= 0",
    }),
  },
);

export type RequestContentServicesFlow =
  typeof RequestContentServicesFlow.infer;

export const requestContentServicesProcessorSchema =
  RequestContentServicesFlow.get("processor");

export const createRequestContentServicesJob = createFlowJobBuilder(
  RequestContentServicesFlow,
);

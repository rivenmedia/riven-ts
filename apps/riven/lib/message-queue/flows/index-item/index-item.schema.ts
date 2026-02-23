import { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestIndexDataFlow = createFlowSchema("index-item", {
  children: MediaItemIndexRequestedResponse,
});

export type RequestIndexDataFlow = z.infer<typeof RequestIndexDataFlow>;

export const requestIndexDataProcessorSchema =
  RequestIndexDataFlow.shape.processor;

export const createRequestIndexDataJob =
  createFlowJobBuilder(RequestIndexDataFlow);

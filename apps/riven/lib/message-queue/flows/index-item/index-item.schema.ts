import { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item/index-requested";

import z from "zod";

import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestIndexDataFlow = createFlowSchema(
  "index-item",
  MediaItemIndexRequestedResponse,
);

export type RequestIndexDataFlow = z.infer<typeof RequestIndexDataFlow>;

export const requestIndexDataProcessorSchema =
  RequestIndexDataFlow.shape.processor;

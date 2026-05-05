import { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";
import { ItemRequest } from "@repo/util-plugin-sdk/schemas/media/item-request";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestItemFlow = createFlowSchema("request-item", {
  children: ContentServiceRequestedResponse,
  input: z.object({
    item: ItemRequest,
  }),
});

export type RequestItemFlow = z.infer<typeof RequestItemFlow>;

export const requestItemProcessorSchema = RequestItemFlow.shape.processor;

export const createRequestItemJob = createFlowJobBuilder(RequestItemFlow);

import { requestedItemSchema } from "@repo/util-plugin-sdk/schemas/media-item/requested-item";

import z from "zod";

import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestContentServicesFlow = createFlowSchema(
  "request-content-services",
  z.array(requestedItemSchema),
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

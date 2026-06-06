import { MediaItemStreamLinkRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestStreamLinkFlow = createFlowSchema("request-stream-link", {
  children: MediaItemStreamLinkRequestedResponse,
  input: z.object({
    mediaEntryId: UUID,
    step: z
      .enum([
        "request-stream-link",
        "validate-response",
        "save-stream-link",
        "blacklist-stream",
        "complete",
      ])
      .default("request-stream-link"),
    link: z.url().optional(),
  }),
  output: z.object({
    link: z.url(),
  }),
});

export type RequestStreamLinkFlow = z.infer<typeof RequestStreamLinkFlow>;

export const requestStreamLinkProcessorSchema =
  RequestStreamLinkFlow.shape.processor;

export const createRequestStreamLinkJob = createFlowJobBuilder(
  RequestStreamLinkFlow,
);

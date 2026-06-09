import { MediaItemStreamLinkRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

const StreamLinkRequestedSuccessResponse =
  MediaItemStreamLinkRequestedResponse.options[0].shape.data;

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
    linkData: StreamLinkRequestedSuccessResponse.optional(),
  }),
  output: StreamLinkRequestedSuccessResponse,
});

export type RequestStreamLinkFlow = z.infer<typeof RequestStreamLinkFlow>;

export const requestStreamLinkProcessorSchema =
  RequestStreamLinkFlow.shape.processor;

export const createRequestStreamLinkJob = createFlowJobBuilder(
  RequestStreamLinkFlow,
);

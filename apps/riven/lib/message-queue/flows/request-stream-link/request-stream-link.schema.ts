import { MediaItemStreamLinkHealthCheckRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-health-check-requested.event";
import { MediaItemStreamLinkRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

const StreamLinkRequestedSuccessResponse =
  MediaItemStreamLinkRequestedResponse.options[0].shape.data;

export const RequestStreamLinkFlow = createFlowSchema("request-stream-link", {
  children: z.union([
    MediaItemStreamLinkRequestedResponse,
    MediaItemStreamLinkHealthCheckRequestedResponse,
  ]),
  input: z.object({
    mediaEntryId: UUID,
    step: z
      .enum([
        "request-stream-link",
        "process-stream-link-response",
        "check-link-health",
        "process-health-check-response",
        "save-healthy-link",
        "blacklist-stream",
        "complete",
      ])
      .default("request-stream-link"),
    linkData: StreamLinkRequestedSuccessResponse.optional(),
    healthCheckJobId: z.string().optional(),
    streamLinkRequestedJobId: z.string().optional(),
  }),
  output: z.url(),
});

export type RequestStreamLinkFlow = z.infer<typeof RequestStreamLinkFlow>;

export const requestStreamLinkProcessorSchema =
  RequestStreamLinkFlow.shape.processor;

export const createRequestStreamLinkJob = createFlowJobBuilder(
  RequestStreamLinkFlow,
);

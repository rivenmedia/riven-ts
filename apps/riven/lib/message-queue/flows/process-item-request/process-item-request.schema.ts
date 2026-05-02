import {
  MediaItemIndexRequestedMovieResponse,
  MediaItemIndexRequestedShowResponse,
} from "@rivenmedia/plugin-sdk/schemas/events/media-item.index.requested.event";
import { UUID } from "@rivenmedia/plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const ProcessItemRequestFlow = createFlowSchema("process-item-request", {
  children: z.union([
    MediaItemIndexRequestedMovieResponse,
    MediaItemIndexRequestedShowResponse,
  ]),
  input: z.object({
    itemRequestId: UUID,
    step: z.enum(["request", "process"]),
  }),
});

export type ProcessItemRequestFlow = z.infer<typeof ProcessItemRequestFlow>;

export const processItemRequestProcessorSchema =
  ProcessItemRequestFlow.shape.processor;

export const createProcessItemRequestJob = createFlowJobBuilder(
  ProcessItemRequestFlow,
);

import { MediaItemSubtitleRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../../utilities/create-flow-schema.ts";

export const RequestSubtitlesFlow = createFlowSchema("request-subtitles", {
  children: MediaItemSubtitleRequestedResponse,
  input: z.object({
    id: UUID,
  }),
  output: z.object({
    count: z.int().nonnegative(),
  }),
});

export type RequestSubtitlesFlow = z.infer<typeof RequestSubtitlesFlow>;

export const requestSubtitlesProcessorSchema =
  RequestSubtitlesFlow.shape.processor;

export const createRequestSubtitlesJob =
  createFlowJobBuilder(RequestSubtitlesFlow);

import { MediaItemSubtitleRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const RequestSubtitlesFlow = createFlowSchema("request-subtitles", {
  children: MediaItemSubtitleRequestedResponse,
  input: z.object({
    id: z.int(),
  }),
  output: z.object({
    count: z.number().nonnegative(),
  }),
});

export type RequestSubtitlesFlow = z.infer<typeof RequestSubtitlesFlow>;

export const requestSubtitlesProcessorSchema =
  RequestSubtitlesFlow.shape.processor;

export const createRequestSubtitlesJob =
  createFlowJobBuilder(RequestSubtitlesFlow);

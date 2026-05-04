import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const ProcessMediaItemFlow = createFlowSchema("process-media-item", {
  input: z.object({
    step: z.enum([
      "scrape",
      "download",
      "validate-download",
      "post-process",
      "validate-post-process",
      "complete",
    ]),
    mediaItem: z.object({
      id: UUID,
      type: MediaItemType,
      fullTitle: z.string(),
    }),
    nextScrapeAttemptTimestamp: z.number().optional(),
  }),
});

export type ProcessMediaItemFlow = z.infer<typeof ProcessMediaItemFlow>;

export const processMediaItemProcessorSchema =
  ProcessMediaItemFlow.shape.processor;

export const createProcessMediaItemJob =
  createFlowJobBuilder(ProcessMediaItemFlow);

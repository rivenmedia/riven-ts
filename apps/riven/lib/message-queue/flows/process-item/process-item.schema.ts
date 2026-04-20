import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const ProcessItemFlow = createFlowSchema("process-item", {
  input: z.object({
    step: z.enum(["index", "scrape", "download", "complete"]),
    requestId: UUID,
    scrapeLevel: MediaItemType,
  }),
});

export type ProcessItemFlow = z.infer<typeof ProcessItemFlow>;

export const processItemProcessorSchema = ProcessItemFlow.shape.processor;

export const createProcessItemJob = createFlowJobBuilder(ProcessItemFlow);

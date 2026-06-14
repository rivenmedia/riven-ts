import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const ManualScrapeFlow = createFlowSchema("manual-scrape", {
  input: z.object({
    mediaItem: z.object({
      id: UUID,
      type: MediaItemType,
      fullTitle: z.string(),
    }),
  }),
});

export type ManualScrapeFlow = z.infer<typeof ManualScrapeFlow>;

export const manualScrapeProcessorSchema = ManualScrapeFlow.shape.processor;

export const createManualScrapeJob = createFlowJobBuilder(ManualScrapeFlow);

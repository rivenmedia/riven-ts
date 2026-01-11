import z from "zod";

import { createFlowSchema } from "../../utilities/create-flow-schema.ts";
import { SortScrapeResultsFlow } from "./steps/sort-scrape-results.schema.ts";

export const ScrapeItemFlow = createFlowSchema(
  "scrape-item",
  SortScrapeResultsFlow.shape.output,
  z.never().optional(),
  z.object({
    id: z.int(),
  }),
);

export type ScrapeItemFlow = z.infer<typeof ScrapeItemFlow>;

export const scrapeItemProcessorSchema = ScrapeItemFlow.shape.processor;

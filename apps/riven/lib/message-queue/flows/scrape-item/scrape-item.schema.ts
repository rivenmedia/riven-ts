import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";
import { ParseScrapeResultsFlow } from "./steps/parse-scrape-results/parse-scrape-results.schema.ts";

export const ScrapeItemFlow = createFlowSchema("scrape-item", {
  children: ParseScrapeResultsFlow.shape.output,
  input: z.object({
    id: z.int(),
  }),
});

export type ScrapeItemFlow = z.infer<typeof ScrapeItemFlow>;

export const scrapeItemProcessorSchema = ScrapeItemFlow.shape.processor;

export const createScrapeItemJob = createFlowJobBuilder(ScrapeItemFlow);

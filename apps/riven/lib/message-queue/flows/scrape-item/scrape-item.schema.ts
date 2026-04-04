import { type } from "arktype";

import { ParseScrapeResultsSandboxedJob } from "../../sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.schema.ts";
import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const ScrapeItemFlow = createFlowSchema("scrape-item", {
  children: ParseScrapeResultsSandboxedJob.get("output"),
  input: type({
    id: "number.integer",
  }),
});

export type ScrapeItemFlow = typeof ScrapeItemFlow.infer;

export const scrapeItemProcessorSchema = ScrapeItemFlow.get("processor");

export const createScrapeItemJob = createFlowJobBuilder(ScrapeItemFlow);

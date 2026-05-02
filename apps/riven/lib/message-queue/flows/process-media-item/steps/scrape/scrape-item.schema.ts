import { UUID } from "@rivenmedia/plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { ParseScrapeResultsSandboxedJob } from "../../../../sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.schema.ts";
import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

export const ScrapeItemFlow = createFlowSchema("scrape-item", {
  children: ParseScrapeResultsSandboxedJob.shape.output,
  input: z.object({
    id: UUID,
  }),
});

export type ScrapeItemFlow = z.infer<typeof ScrapeItemFlow>;

export const scrapeItemProcessorSchema = ScrapeItemFlow.shape.processor;

export const createScrapeItemJob = createFlowJobBuilder(ScrapeItemFlow);

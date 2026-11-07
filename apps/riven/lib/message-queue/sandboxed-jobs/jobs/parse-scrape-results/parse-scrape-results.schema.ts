import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createSandboxedJobSchema } from "#message-queue/sandboxed-jobs/utilities/create-sandboxed-job-schema.ts";
import { createFlowJobBuilder } from "#message-queue/utilities/create-flow-job-builder.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export const ParseScrapeResultsSandboxedJob = createSandboxedJobSchema(
  "scrape-item.parse-scrape-results",
  {
    children: z.object({
      id: UUID,
      results: z.record(z.string(), z.string().nonempty()),
    }),
    output: z.object({
      id: UUID,
      results: z.record(z.hash("sha1"), z.custom<ParsedData>()),
    }),
    input: z.object({
      id: UUID,
      title: z.string(),
    }),
  },
);

export type ParseScrapeResultsSandboxedJob = z.infer<
  typeof ParseScrapeResultsSandboxedJob
>;

export const parseScrapeResultsProcessorSchema =
  ParseScrapeResultsSandboxedJob.shape.processor;

export const createParseScrapeResultsJob = createFlowJobBuilder(
  ParseScrapeResultsSandboxedJob,
);

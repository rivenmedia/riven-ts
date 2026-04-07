import { MediaItemScrapeRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import z from "zod";

import { createFlowJobBuilder } from "../../../utilities/create-flow-job-builder.ts";
import { createSandboxedJobSchema } from "../../utilities/create-sandboxed-job-schema.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export const ParseScrapeResultsSandboxedJob = createSandboxedJobSchema(
  "scrape-item.parse-scrape-results",
  {
    children: MediaItemScrapeRequestedResponse,
    output: z.object({
      id: z.uuidv4(),
      results: z.record(z.hash("sha1"), z.custom<ParsedData>()),
    }),
    input: z.object({
      id: z.uuidv4(),
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

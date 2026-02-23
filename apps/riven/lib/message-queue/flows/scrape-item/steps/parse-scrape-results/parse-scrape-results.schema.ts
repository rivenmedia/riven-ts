import { MediaItemScrapeRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export const ParseScrapeResultsFlow = createFlowSchema(
  "scrape-item.parse-scrape-results",
  {
    children: MediaItemScrapeRequestedResponse,
    output: z.object({
      id: z.int(),
      results: z.record(z.hash("sha1"), z.custom<ParsedData>()),
    }),
    input: z.object({
      id: z.int(),
    }),
  },
);

export type ParseScrapeResultsFlow = z.infer<typeof ParseScrapeResultsFlow>;

export const parseScrapeResultsProcessorSchema =
  ParseScrapeResultsFlow.shape.processor;

export const createParseScrapeResultsJob = createFlowJobBuilder(
  ParseScrapeResultsFlow,
);

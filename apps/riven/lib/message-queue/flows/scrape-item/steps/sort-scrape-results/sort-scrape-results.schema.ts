import { MediaItemScrapeRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const SortScrapeResultsFlow = createFlowSchema(
  "scrape-item.sort-scrape-results",
  {
    children: MediaItemScrapeRequestedResponse,
    output: z.object({
      id: z.int(),
      results: z.array(z.custom<RankedResult>()),
    }),
    input: z.object({
      id: z.int(),
    }),
  },
);

export type SortScrapeResultsFlow = z.infer<typeof SortScrapeResultsFlow>;

export const sortScrapeResultsProcessorSchema =
  SortScrapeResultsFlow.shape.processor;

export const createSortScrapeResultsJob = createFlowJobBuilder(
  SortScrapeResultsFlow,
);

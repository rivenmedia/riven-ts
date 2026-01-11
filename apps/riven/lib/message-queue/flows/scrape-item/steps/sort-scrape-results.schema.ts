import { MediaItemScrapeRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import z from "zod";

import { createFlowSchema } from "../../../utilities/create-flow-schema.ts";

import type { DefaultParserResult } from "parse-torrent-title";

export const SortScrapeResultsFlow = createFlowSchema(
  "sort-scrape-results",
  MediaItemScrapeRequestedResponse,
  z.object({
    id: z.int(),
    results: z.record(z.string(), z.custom<DefaultParserResult>()),
  }),
  z.object({
    id: z.int(),
    title: z.string(),
  }),
);

export type SortScrapeResultsFlow = z.infer<typeof SortScrapeResultsFlow>;

export const sortScrapeResultsProcessorSchema =
  SortScrapeResultsFlow.shape.processor;

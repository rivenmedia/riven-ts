import {
  RequestIndexDataFlow,
  requestIndexDataProcessorSchema,
} from "./index-item/index-item.schema.ts";
import {
  RequestContentServicesFlow,
  requestContentServicesProcessorSchema,
} from "./request-content-services/request-content-services.schema.ts";
import {
  ScrapeItemFlow,
  scrapeItemProcessorSchema,
} from "./scrape-item/scrape-item.schema.js";
import {
  type SortScrapeResultsFlow,
  sortScrapeResultsProcessorSchema,
} from "./scrape-item/steps/sort-scrape-results.schema.ts";

import type z from "zod";

export type Flow =
  | RequestIndexDataFlow
  | RequestContentServicesFlow
  | ScrapeItemFlow
  | SortScrapeResultsFlow;

export const FlowHandlers = {
  indexing: requestIndexDataProcessorSchema,
  "request-content-services": requestContentServicesProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "sort-scrape-results": sortScrapeResultsProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

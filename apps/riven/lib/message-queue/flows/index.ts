import z from "zod";

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
  SortScrapeResultsFlow,
  sortScrapeResultsProcessorSchema,
} from "./scrape-item/steps/sort-scrape-results.schema.ts";

export const Flow = z.discriminatedUnion("name", [
  RequestIndexDataFlow,
  RequestContentServicesFlow,
  ScrapeItemFlow,
  SortScrapeResultsFlow,
]);

export type Flow = z.infer<typeof Flow>;

export const FlowHandlers = {
  "index-item": requestIndexDataProcessorSchema,
  "request-content-services": requestContentServicesProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "sort-scrape-results": sortScrapeResultsProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

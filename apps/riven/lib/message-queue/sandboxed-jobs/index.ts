import z from "zod";

import {
  MapItemsToFilesSandboxedJob,
  mapItemsToFilesProcessorSchema,
} from "./jobs/map-items-to-files/map-items-to-files.schema.ts";
import {
  ParseScrapeResultsSandboxedJob,
  parseScrapeResultsProcessorSchema,
} from "./jobs/parse-scrape-results/parse-scrape-results.schema.ts";

export const SandboxedJobDefinition = z.discriminatedUnion("name", [
  ParseScrapeResultsSandboxedJob,
  MapItemsToFilesSandboxedJob,
]);

export type SandboxedJobDefinition = z.infer<typeof SandboxedJobDefinition>;

export const SandboxedJobHandlers = {
  "scrape-item.parse-scrape-results": parseScrapeResultsProcessorSchema,
  "download-item.map-items-to-files": mapItemsToFilesProcessorSchema,
} satisfies Record<SandboxedJobDefinition["name"], z.ZodFunction>;

import {
  MapItemsToFilesSandboxedJob,
  mapItemsToFilesProcessorSchema,
} from "./jobs/map-items-to-files/map-items-to-files.schema.ts";
import {
  ParseScrapeResultsSandboxedJob,
  parseScrapeResultsProcessorSchema,
} from "./jobs/parse-scrape-results/parse-scrape-results.schema.ts";
import {
  ValidateTorrentFilesSandboxedJob,
  validateTorrentFilesProcessorSchema,
} from "./jobs/validate-torrent-files/validate-torrent-files.schema.ts";

export const SandboxedJobDefinition = ParseScrapeResultsSandboxedJob.or(
  MapItemsToFilesSandboxedJob,
).or(ValidateTorrentFilesSandboxedJob);

export type SandboxedJobDefinition = typeof SandboxedJobDefinition.infer;

export const SandboxedJobHandlers = {
  "scrape-item.parse-scrape-results": parseScrapeResultsProcessorSchema,
  "download-item.map-items-to-files": mapItemsToFilesProcessorSchema,
  "download-item.validate-torrent-files": validateTorrentFilesProcessorSchema,
} satisfies Record<SandboxedJobDefinition["name"], Function>;

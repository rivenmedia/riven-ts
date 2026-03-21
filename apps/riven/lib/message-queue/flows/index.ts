import z from "zod";

import {
  DownloadItemFlow,
  downloadItemProcessorSchema,
} from "./download-item/download-item.schema.ts";
import {
  FindValidTorrentFlow,
  findValidTorrentProcessorSchema,
} from "./download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import {
  MapItemsToFilesFlow,
  mapItemsToFilesProcessorSchema,
} from "./download-item/steps/map-items-to-files/map-items-to-files.schema.ts";
import {
  RankStreamsFlow,
  rankStreamsProcessorSchema,
} from "./download-item/steps/rank-streams/rank-streams.schema.ts";
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
} from "./scrape-item/scrape-item.schema.ts";
import {
  ParseScrapeResultsFlow,
  parseScrapeResultsProcessorSchema,
} from "./scrape-item/steps/parse-scrape-results/parse-scrape-results.schema.ts";

export const Flow = z.discriminatedUnion("name", [
  RequestIndexDataFlow,
  RequestContentServicesFlow,
  ScrapeItemFlow,
  ParseScrapeResultsFlow,
  DownloadItemFlow,
  FindValidTorrentFlow,
  MapItemsToFilesFlow,
  RankStreamsFlow,
]);

export type Flow = z.infer<typeof Flow>;

export const FlowHandlers = {
  "index-item": requestIndexDataProcessorSchema,
  "request-content-services": requestContentServicesProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "scrape-item.parse-scrape-results": parseScrapeResultsProcessorSchema,
  "download-item": downloadItemProcessorSchema,
  "download-item.find-valid-torrent": findValidTorrentProcessorSchema,
  "download-item.map-items-to-files": mapItemsToFilesProcessorSchema,
  "download-item.rank-streams": rankStreamsProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

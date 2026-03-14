import z from "zod";

import {
  DownloadItemFlow,
  downloadItemProcessorSchema,
} from "./download-item/download-item.schema.ts";
import {
  FindValidTorrentContainerFlow,
  findValidTorrentContainerProcessorSchema,
} from "./download-item/steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";
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
  RequestSubtitlesFlow,
  requestSubtitlesProcessorSchema,
} from "./request-subtitles/request-subtitles.schema.ts";
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
  FindValidTorrentContainerFlow,
  MapItemsToFilesFlow,
  RankStreamsFlow,
  RequestSubtitlesFlow,
]);

export type Flow = z.infer<typeof Flow>;

export const FlowHandlers = {
  "index-item": requestIndexDataProcessorSchema,
  "request-content-services": requestContentServicesProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "scrape-item.parse-scrape-results": parseScrapeResultsProcessorSchema,
  "download-item": downloadItemProcessorSchema,
  "download-item.find-valid-torrent-container":
    findValidTorrentContainerProcessorSchema,
  "download-item.map-items-to-files": mapItemsToFilesProcessorSchema,
  "download-item.rank-streams": rankStreamsProcessorSchema,
  "request-subtitles": requestSubtitlesProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

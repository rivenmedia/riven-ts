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
  RankStreamsFlow,
  rankStreamsProcessorSchema,
} from "./download-item/steps/rank-streams/rank-streams.schema.ts";
import {
  RequestIndexDataFlow,
  requestIndexDataProcessorSchema,
} from "./index-item/index-item.schema.ts";
import {
  ProcessItemFlow,
  processItemProcessorSchema,
} from "./process-item/process-item.schema.ts";
import {
  RequestContentServicesFlow,
  requestContentServicesProcessorSchema,
} from "./request-content-services/request-content-services.schema.ts";
import {
  ScrapeItemFlow,
  scrapeItemProcessorSchema,
} from "./scrape-item/scrape-item.schema.ts";

export const Flow = z.discriminatedUnion("name", [
  RequestIndexDataFlow,
  RequestContentServicesFlow,
  ScrapeItemFlow,
  DownloadItemFlow,
  FindValidTorrentFlow,
  RankStreamsFlow,
  ProcessItemFlow,
]);

export type Flow = z.infer<typeof Flow>;

export const FlowHandlers = {
  "index-item": requestIndexDataProcessorSchema,
  "request-content-services": requestContentServicesProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "download-item": downloadItemProcessorSchema,
  "download-item.find-valid-torrent": findValidTorrentProcessorSchema,
  "download-item.rank-streams": rankStreamsProcessorSchema,
  "process-item": processItemProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

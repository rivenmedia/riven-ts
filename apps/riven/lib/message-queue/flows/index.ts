import z from "zod";

import {
  ProcessItemRequestFlow,
  processItemRequestProcessorSchema,
} from "./process-item-request/process-item-request.schema.ts";
import {
  ProcessMediaItemFlow,
  processMediaItemProcessorSchema,
} from "./process-media-item/process-media-item.schema.ts";
import {
  DownloadItemFlow,
  downloadItemProcessorSchema,
} from "./process-media-item/steps/download/download-item.schema.ts";
import {
  FindValidTorrentFlow,
  findValidTorrentProcessorSchema,
} from "./process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import {
  RankStreamsFlow,
  rankStreamsProcessorSchema,
} from "./process-media-item/steps/download/steps/rank-streams/rank-streams.schema.ts";
import {
  ScrapeItemFlow,
  scrapeItemProcessorSchema,
} from "./process-media-item/steps/scrape/scrape-item.schema.ts";
import {
  RequestContentServicesFlow,
  requestContentServicesProcessorSchema,
} from "./request-content-services/request-content-services.schema.ts";

export const Flow = z.discriminatedUnion("name", [
  ProcessItemRequestFlow,
  RequestContentServicesFlow,
  ScrapeItemFlow,
  DownloadItemFlow,
  FindValidTorrentFlow,
  RankStreamsFlow,
  ProcessMediaItemFlow,
]);

export type Flow = z.infer<typeof Flow>;

export const FlowHandlers = {
  "request-content-services": requestContentServicesProcessorSchema,
  "process-item-request": processItemRequestProcessorSchema,
  "process-media-item": processMediaItemProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "download-item": downloadItemProcessorSchema,
  "download-item.find-valid-torrent": findValidTorrentProcessorSchema,
  "download-item.rank-streams": rankStreamsProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

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
  RequestContentServicesFlow,
  requestContentServicesProcessorSchema,
} from "./request-content-services/request-content-services.schema.ts";
import {
  ScrapeItemFlow,
  scrapeItemProcessorSchema,
} from "./scrape-item/scrape-item.schema.ts";

export const Flow = RequestIndexDataFlow.or(RequestContentServicesFlow)
  .or(ScrapeItemFlow)
  .or(DownloadItemFlow)
  .or(FindValidTorrentFlow)
  .or(RankStreamsFlow);

export type Flow = typeof Flow.infer;

export const FlowHandlers = {
  "index-item": requestIndexDataProcessorSchema,
  "request-content-services": requestContentServicesProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "download-item": downloadItemProcessorSchema,
  "download-item.find-valid-torrent": findValidTorrentProcessorSchema,
  "download-item.rank-streams": rankStreamsProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

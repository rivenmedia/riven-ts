import z from "zod";

import {
  PostProcessMediaItemFlow,
  postProcessMediaItemProcessorSchema,
} from "./post-process-media-item/post-process-media-item.schema.ts";
import {
  RequestSubtitlesFlow,
  requestSubtitlesProcessorSchema,
} from "./post-process-media-item/steps/request-subtitles/request-subtitles.schema.ts";
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
  RequestContentServiceFlow,
  requestContentServiceProcessorSchema,
} from "./request-content-service/request-content-service.schema.ts";
import {
  RequestStreamLinkFlow,
  requestStreamLinkProcessorSchema,
} from "./request-stream-link/request-stream-link.schema.ts";

export const Flow = z.discriminatedUnion("name", [
  ProcessItemRequestFlow,
  RequestContentServiceFlow,
  ScrapeItemFlow,
  DownloadItemFlow,
  FindValidTorrentFlow,
  RankStreamsFlow,
  RequestSubtitlesFlow,
  ProcessMediaItemFlow,
  PostProcessMediaItemFlow,
  RequestStreamLinkFlow,
]);

export type Flow = z.infer<typeof Flow>;

export const FlowHandlers = {
  "request-content-services": requestContentServiceProcessorSchema,
  "process-item-request": processItemRequestProcessorSchema,
  "process-media-item": processMediaItemProcessorSchema,
  "scrape-item": scrapeItemProcessorSchema,
  "download-item": downloadItemProcessorSchema,
  "download-item.find-valid-torrent": findValidTorrentProcessorSchema,
  "download-item.rank-streams": rankStreamsProcessorSchema,
  "request-stream-link": requestStreamLinkProcessorSchema,
  "request-subtitles": requestSubtitlesProcessorSchema,
  "post-process-media-item": postProcessMediaItemProcessorSchema,
} satisfies Record<Flow["name"], z.ZodFunction>;

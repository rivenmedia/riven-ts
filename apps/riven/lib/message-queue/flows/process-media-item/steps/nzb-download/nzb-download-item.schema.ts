import { MediaItemNzbDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-download-requested.event";
import { NzbScrapeMediaItemPayload } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

// The output of each plugin child job for nzb-download.requested is exactly the
// SDK response schema. Re-export to keep the flow's child schema in lockstep
// with the SDK contract (no silent field stripping if the SDK gains fields).
export const NzbDownloadPluginResult = MediaItemNzbDownloadRequestedResponse;
export type NzbDownloadPluginResult = MediaItemNzbDownloadRequestedResponse;

export const NzbDownloadItemFlow = createFlowSchema("nzb-download-item", {
  children: NzbDownloadPluginResult,
  input: z.object({
    item: NzbScrapeMediaItemPayload,
    nzbUrl: z.url(),
    expectedTitle: z.string().min(1),
  }),
  output: z.object({
    altmountId: z.string().min(1),
    item: NzbScrapeMediaItemPayload,
  }),
});

export type NzbDownloadItemFlow = z.infer<typeof NzbDownloadItemFlow>;

export const nzbDownloadItemProcessorSchema =
  NzbDownloadItemFlow.shape.processor;

export const createNzbDownloadItemJob =
  createFlowJobBuilder(NzbDownloadItemFlow);

import {
  MediaItemNzbScrapeRequestedResponse,
  NzbCandidate,
  NzbScrapeMediaItemPayload,
} from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

// The output of each plugin child job for nzb-scrape.requested is exactly the
// SDK response schema. Re-export to keep the flow's child schema in lockstep
// with the SDK contract (no silent field stripping if the SDK gains fields).
export const NzbScrapePluginResult = MediaItemNzbScrapeRequestedResponse;
export type NzbScrapePluginResult = MediaItemNzbScrapeRequestedResponse;

/**
 * When scrape succeeds, the processor returns the chosen first candidate
 * so the parent flow can directly enqueue nzb-download.
 */
export const NzbScrapeItemOutput = z.object({
  chosen: NzbCandidate,
  item: NzbScrapeMediaItemPayload,
});

export type NzbScrapeItemOutput = z.infer<typeof NzbScrapeItemOutput>;

export const NzbScrapeItemFlow = createFlowSchema("nzb-scrape-item", {
  children: NzbScrapePluginResult,
  input: z.object({
    id: UUID,
  }),
  output: NzbScrapeItemOutput,
});

export type NzbScrapeItemFlow = z.infer<typeof NzbScrapeItemFlow>;

export const nzbScrapeItemProcessorSchema = NzbScrapeItemFlow.shape.processor;

export const createNzbScrapeItemJob = createFlowJobBuilder(NzbScrapeItemFlow);

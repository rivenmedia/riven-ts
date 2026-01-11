import { MediaItemScrapeRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item/scrape-requested";

import z from "zod";

import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const ScrapeItemFlow = createFlowSchema(
  "scrape-item",
  MediaItemScrapeRequestedResponse,
  z.never().optional(),
  z.object({
    id: z.int(),
  }),
);

export type ScrapeItemFlow = z.infer<typeof ScrapeItemFlow>;

export const scrapeItemProcessorSchema = ScrapeItemFlow.shape.processor;

import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import {
  NzbCandidate,
  NzbScrapeMediaItemPayload,
} from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const ProcessMediaItemFlow = createFlowSchema("process-media-item", {
  input: z.object({
    step: z.enum([
      "scrape",
      "validate-scrape",
      "download",
      "validate-download",
      "nzb-scrape",
      "validate-nzb-scrape",
      "nzb-download",
      "validate-nzb-download",
      "complete",
    ]),
    mediaItem: z.object({
      id: UUID,
      type: MediaItemType,
      fullTitle: z.string(),
    }),
    isRootItem: z.boolean().default(true),
    /**
     * Persisted after a successful nzb-scrape step so the nzb-download step
     * can pick up the chosen candidate without re-reading BullMQ children.
     */
    nzbScrapeResult: z
      .object({
        chosen: NzbCandidate,
        item: NzbScrapeMediaItemPayload,
      })
      .optional(),
  }),
});

export type ProcessMediaItemFlow = z.infer<typeof ProcessMediaItemFlow>;

export const processMediaItemProcessorSchema =
  ProcessMediaItemFlow.shape.processor;

export const createProcessMediaItemJob =
  createFlowJobBuilder(ProcessMediaItemFlow);

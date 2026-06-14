import { Torrent } from "@repo/util-plugin-sdk/schemas/torrents/torrent";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";
import { atLeastOnePropertyRequired } from "@repo/util-plugin-sdk/validation";

import z from "zod";

import { createFlowJobBuilder } from "../../../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../../../utilities/create-flow-schema.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const RankStreamsFlow = createFlowSchema("download-item.rank-streams", {
  children: Torrent,
  input: z.object({
    id: UUID,
    scrapeSource: z.enum(["manual", "auto"]).default("auto"),
    streams: z
      .record(z.hash("sha1"), z.string())
      .refine((val) => atLeastOnePropertyRequired(val), {
        message: "At least one stream must be provided",
      }),
  }),
  output: z.custom<RankedResult[]>(),
});

export type RankStreamsFlow = z.infer<typeof RankStreamsFlow>;

export const rankStreamsProcessorSchema = RankStreamsFlow.shape.processor;

export const createRankStreamsJob = createFlowJobBuilder(RankStreamsFlow);

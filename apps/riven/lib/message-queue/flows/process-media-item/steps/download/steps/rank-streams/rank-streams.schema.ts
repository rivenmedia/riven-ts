import {
  type RankedResult,
  RankingModelSchema,
  SettingsSchema,
} from "@repo/util-rank-torrent-name";

import { Torrent } from "@rivenmedia/plugin-sdk/schemas/torrents/torrent";
import { UUID } from "@rivenmedia/plugin-sdk/schemas/utilities/uuid.schema";
import { atLeastOnePropertyRequired } from "@rivenmedia/plugin-sdk/validation";

import z from "zod";

import { createFlowJobBuilder } from "../../../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../../../utilities/create-flow-schema.ts";

export const RankStreamsFlow = createFlowSchema("download-item.rank-streams", {
  children: Torrent,
  input: z.object({
    id: UUID,
    streams: z
      .record(z.hash("sha1"), z.string())
      .refine(atLeastOnePropertyRequired, {
        message: "At least one stream must be provided",
      }),
    rtnSettings: SettingsSchema,
    rtnRankingModel: RankingModelSchema,
  }),
  output: z.custom<RankedResult[]>(),
});

export type RankStreamsFlow = z.infer<typeof RankStreamsFlow>;

export const rankStreamsProcessorSchema = RankStreamsFlow.shape.processor;

export const createRankStreamsJob = createFlowJobBuilder(RankStreamsFlow);

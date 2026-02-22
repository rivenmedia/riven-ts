import { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";
import { atLeastOnePropertyRequired } from "@repo/util-plugin-sdk/validation";
import {
  type RankedResult,
  RankingModelSchema,
  SettingsSchema,
} from "@repo/util-rank-torrent-name";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

export const RankStreamsFlow = createFlowSchema("download-item.rank-streams", {
  children: TorrentContainer,
  input: z.object({
    id: z.int(),
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

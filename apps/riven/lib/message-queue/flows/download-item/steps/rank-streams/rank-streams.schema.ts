import { Torrent } from "@repo/util-plugin-sdk/schemas/torrents/torrent";
import { type } from "@repo/util-plugin-sdk/validation";
import {
  RankedResult,
  RankingModelSchema,
  SettingsSchema,
} from "@repo/util-rank-torrent-name";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

export const RankStreamsFlow = createFlowSchema("download-item.rank-streams", {
  children: Torrent,
  input: type({
    id: "number.integer > 0",
    // TODO: Non-empty record validation
    streams: {
      "[string.hex == 40]": "string > 0",
    },
    rtnSettings: SettingsSchema,
    rtnSettingsModel: RankingModelSchema,
  }),
  output: RankedResult.array(),
});

export type RankStreamsFlow = typeof RankStreamsFlow.infer;

export const rankStreamsProcessorSchema = RankStreamsFlow.get("processor");

export const createRankStreamsJob = createFlowJobBuilder(RankStreamsFlow);

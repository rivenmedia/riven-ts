import {
  RankingModelSchema,
  Settings,
  createRankingModel,
  createSettings,
} from "@repo/util-rank-torrent-name";

import z from "zod";

import { presets } from "./presets/index.ts";

const RankingModelPreset = z.enum(["default"]);
const RankingModel = z.union([RankingModelSchema, RankingModelPreset]);

export const RawRankingConfig = z.strictObject({
  $schema: z.string().optional(),
  settings: Settings.in.optional(),
  rankingModel: RankingModel.default("default"),
});

export type RawRankingConfig = z.infer<typeof RawRankingConfig>;

export const RankingConfig = RawRankingConfig.transform((data) => {
  if (typeof data.rankingModel === "string") {
    const preset = presets[data.rankingModel];

    return {
      rankingModel: createRankingModel(preset.rankingModel),
      settings: createSettings({
        ...preset.settings,
        ...data.settings,
      }),
    };
  }

  return {
    rankingModel: createRankingModel(data.rankingModel),
    settings: createSettings(data.settings),
  };
});

export type RankingConfig = z.infer<typeof RankingConfig>;
export type RankingConfigFileContents = z.input<typeof RankingConfig>;

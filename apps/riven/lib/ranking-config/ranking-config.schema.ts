import {
  RankingModelSchema,
  SettingsSchema,
} from "@repo/util-rank-torrent-name";

import z from "zod";

import { defaultPreset } from "./presets/default-preset.ts";

export const RankingConfigBase = z.strictObject({
  settings: SettingsSchema.in.default(SettingsSchema.in.parse({})),
  rankingModel: RankingModelSchema.default(RankingModelSchema.parse({})),
});

export type RankingConfigBase = z.infer<typeof RankingConfigBase>;

const JsonSchemaBase = z.strictObject({
  $schema: z.string().optional(),
});

export const RankingConfig = z.discriminatedUnion("preset", [
  JsonSchemaBase.extend({
    preset: z.literal("default"),
  }).transform((data) => ({
    ...data,
    ...defaultPreset,
  })),
  JsonSchemaBase.safeExtend(
    z.strictObject({
      preset: z.literal("custom"),
      settings: SettingsSchema.in.default(SettingsSchema.in.parse({})),
      rankingModel: RankingModelSchema.default(RankingModelSchema.parse({})),
    }).shape,
  ),
]);

export type RankingConfig = z.infer<typeof RankingConfig>;
export type RankingConfigFileContents = z.input<typeof RankingConfig>;

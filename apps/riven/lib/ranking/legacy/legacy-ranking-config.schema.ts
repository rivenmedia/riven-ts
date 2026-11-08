import {
  RankingModelSchema,
  SettingsSchema,
} from "@repo/util-rank-torrent-name";

import z from "zod";

/**
 * The format of the retired `riven-ranking-config.json` file, read once at boot
 * to import it into the database.
 */
export const RawRankingConfig = z.strictObject({
  $schema: z.string().optional(),
  settings: SettingsSchema.optional(),
  rankingModel: z
    .union([RankingModelSchema, z.enum(["default"])])
    .default("default"),
});

export type RawRankingConfig = z.infer<typeof RawRankingConfig>;

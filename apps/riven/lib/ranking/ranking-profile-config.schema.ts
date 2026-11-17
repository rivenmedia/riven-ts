import {
  RankingModelSchema,
  SettingsSchema,
} from "@repo/util-rank-torrent-name";

import { z } from "zod";

type Unwrapped<T> = T extends z.ZodDefault<infer Inner> ? Inner : T;

type SparseObject<Shape extends z.ZodRawShape> = z.ZodObject<
  { [K in keyof Shape]: z.ZodOptional<Unwrapped<Shape[K]> & z.ZodType> },
  z.core.$strict
>;

/**
 * Builds a strict, fully-optional version of an RTN object schema. Defaults are
 * stripped so that omitted keys stay omitted (sparse) instead of being filled in.
 */
function toSparseSchema<Shape extends z.ZodRawShape>(
  schema: z.ZodObject<Shape>,
): SparseObject<Shape> {
  const shape: Record<string, z.ZodType> = {};

  for (const [key, field] of Object.entries(schema.shape)) {
    const inner =
      field instanceof z.ZodDefault ? (field.unwrap() as z.ZodType) : field;

    shape[key] = (inner as z.ZodType).optional();
  }

  return z.strictObject(shape) as unknown as SparseObject<Shape>;
}

export const RankingProfileConfig = z.strictObject({
  rankingModel: toSparseSchema(RankingModelSchema).optional(),
  settings: toSparseSchema(SettingsSchema)
    .extend({
      resolutions: toSparseSchema(
        SettingsSchema.shape.resolutions.unwrap(),
      ).optional(),
      options: toSparseSchema(SettingsSchema.shape.options.unwrap()).optional(),
      languages: toSparseSchema(
        SettingsSchema.shape.languages.unwrap(),
      ).optional(),
    })
    .optional(),
});

export type RankingProfileConfig = z.infer<typeof RankingProfileConfig>;

import { MediaItemContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";

import z from "zod";

const IntRange = z
  .tuple([z.int().nonnegative(), z.int().nonnegative()])
  .refine(([min, max]) => min <= max, {
    message: "Minimum value must be less than or equal to maximum value",
  });

const FloatRange = z
  .tuple([z.number().nonnegative(), z.number().nonnegative()])
  .refine(([min, max]) => min <= max, {
    message: "Minimum value must be less than or equal to maximum value",
  });

export const FilterPopoverFormSchema = z.object({
  contentRatings: z.partialRecord(MediaItemContentRating, z.boolean()),
  genres: z.record(z.int(), z.boolean()),
  language: z.string(),
  releaseDateFrom: z.iso.date().or(z.literal("")),
  releaseDateTo: z.iso.date().or(z.literal("")),
  runtime: IntRange,
  voteAverage: FloatRange,
  voteCount: IntRange,
});

export type FilterPopoverFormValues = z.infer<typeof FilterPopoverFormSchema>;

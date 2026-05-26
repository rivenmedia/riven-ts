import z from "zod";

import { mediaRequestSchema } from "../__generated__/zod/mediaRequestSchema.ts";
import { userSchema } from "../__generated__/zod/userSchema.ts";

const seerrMediaRequestSchema = mediaRequestSchema.extend({
  modifiedBy: z.union([userSchema, z.string()]).nullish(),
});

/**
 * Extends the base `MediaRequest` to include season information and the `tv` type
 */
const TvMediaRequest = seerrMediaRequestSchema.extend({
  type: z.literal("tv"),
  seasons: z
    .array(
      seerrMediaRequestSchema.extend({
        seasonNumber: z.int().nonnegative(),
      }),
    )
    .min(1),
});

/**
 * Extends the base `MediaRequest` to include the `movie` type
 */
const MovieMediaRequest = seerrMediaRequestSchema.extend({
  type: z.literal("movie"),
});

/**
 * Extends the base `MediaRequest` schema to differentiate movie and tv requests.
 *
 * @see {@link TvMediaRequest}
 * @see {@link MovieMediaRequest}
 */
export const ExtendedMediaRequest = z.discriminatedUnion("type", [
  MovieMediaRequest,
  TvMediaRequest,
]);

export type ExtendedMediaRequest = z.infer<typeof ExtendedMediaRequest>;

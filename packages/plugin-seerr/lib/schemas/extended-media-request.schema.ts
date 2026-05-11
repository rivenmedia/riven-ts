import z from "zod";

import { mediaRequestSchema } from "../__generated__/zod/mediaRequestSchema.ts";

/**
 * Extends the base `MediaRequest` to include season information and the `tv` type
 */
const TvMediaRequest = mediaRequestSchema.extend({
  type: z.literal("tv"),
  seasons: z
    .array(
      mediaRequestSchema.extend({
        seasonNumber: z.int().nonnegative(),
      }),
    )
    .min(1),
});

/**
 * Extends the base `MediaRequest` to include the `movie` type
 */
const MovieMediaRequest = mediaRequestSchema.extend({
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

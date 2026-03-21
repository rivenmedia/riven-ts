import z from "zod";

import { mediaRequestSchema } from "../__generated__/index.ts";

/**
 * Extends the base `MediaRequest` to include season information and the `tv` type
 */
export const TvMediaRequest = mediaRequestSchema.extend({
  type: z.literal("tv"),
  seasons: z
    .array(
      mediaRequestSchema.extend({
        seasonNumber: z.int().nonnegative(),
      }),
    )
    .min(1),
});

export type TvMediaRequest = z.infer<typeof TvMediaRequest>;

/**
 * Extends the base `MediaRequest` to include the `movie` type
 */
export const MovieMediaRequest = mediaRequestSchema.extend({
  type: z.literal("movie"),
});

export type MovieMediaRequest = z.infer<typeof MovieMediaRequest>;

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

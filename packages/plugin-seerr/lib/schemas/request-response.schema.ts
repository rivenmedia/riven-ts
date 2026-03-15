import z from "zod";

import {
  getRequest200Schema,
  mediaRequestSchema,
} from "../__generated__/index.ts";

/**
 * The Overseerr API returns a `type` field on MediaRequest at runtime
 * indicating "movie" or "tv", but it is not documented in the OpenAPI spec.
 */
export const MediaRequestWithType = mediaRequestSchema.extend({
  type: z.enum(["movie", "tv"]),
});

export type MediaRequestWithType = z.infer<typeof MediaRequestWithType>;

export const RequestResponse = getRequest200Schema.extend({
  results: z.array(MediaRequestWithType).optional(),
});

export type RequestResponse = z.infer<typeof RequestResponse>;

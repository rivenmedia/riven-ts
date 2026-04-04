import { type } from "arktype";

import type { MediaRequest } from "../__generated__/index.ts";

const MediaRequestBase = type.declare<MediaRequest>().type({
  "createdAt?": "string",
  "is4k?": "boolean",
  "media?": {
    "createdAt?": "string",
    "id?": "number",
    "tmdbId?": "number",
    "updatedAt?": "string",
    "requests?": [],
    "status?": "number",
    "tvdbId?": "number | null",
  },
  "modifiedBy?": {},
  id: "number",
  status: "number",
  "profileId?": "number | null",
  "requestedBy?": {},
  "rootFolder?": "string | null",
  "serverId?": "number | null",
  "updatedAt?": "string",
});

/**
 * Extends the base `MediaRequest` to include season information and the `tv` type
 */
export const TvMediaRequest = type({
  type: "'tv'",
  seasons: MediaRequestBase.merge({
    seasonNumber: "number.integer > 0",
  }).array(),
});

export type TvMediaRequest = typeof TvMediaRequest.infer;

/**
 * Extends the base `MediaRequest` to include the `movie` type
 */
export const MovieMediaRequest = MediaRequestBase.merge({
  type: "'movie'",
});

export type MovieMediaRequest = typeof MovieMediaRequest.infer;

/**
 * Extends the base `MediaRequest` schema to differentiate movie and tv requests.
 *
 * @see {@link TvMediaRequest}
 * @see {@link MovieMediaRequest}
 */
export const ExtendedMediaRequest = type.or(MovieMediaRequest, TvMediaRequest);

export type ExtendedMediaRequest = typeof ExtendedMediaRequest.infer;

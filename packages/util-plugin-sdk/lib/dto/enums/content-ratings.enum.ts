import { registerEnumType } from "type-graphql";
import z from "zod";

import type { ValueOf } from "type-fest";

export const MediaItemContentRating = {
  G: "g",
  PG: "pg",
  PG_13: "pg_13",
  R: "r",
  NC_17: "nc_17",
  TV_Y: "tv_y",
  TV_Y7: "tv_y7",
  TV_G: "tv_g",
  TV_PG: "tv_pg",
  TV_14: "tv_14",
  TV_MA: "tv_ma",
  unknown: "unknown",
} as const;

export type MediaItemContentRating = ValueOf<typeof MediaItemContentRating>;

registerEnumType(MediaItemContentRating, {
  name: "MediaItemContentRating",
  description:
    "The content rating of a media item. See MovieContentRating and ShowContentRating for more specific ratings.",
});

/**
 * The content rating of a movie, based on the MPAA rating system.
 *
 * @see {@link https://en.wikipedia.org/wiki/MPAA_film_rating_system MPAA film rating system} for more details.
 */
export const MovieContentRating = z
  .enum(MediaItemContentRating)
  .extract(["G", "PG", "PG_13", "R", "NC_17", "unknown"]);

export type MovieContentRating = z.infer<typeof MovieContentRating>;

registerEnumType(MovieContentRating.enum, {
  name: "MovieContentRating",
  description:
    "The content rating of a movie. See https://en.wikipedia.org/wiki/MPAA_film_rating_system for more details.",
});

/**
 * The content rating of a TV show, based on the TV Parental Guidelines.
 *
 * @see {@link https://en.wikipedia.org/wiki/TV_Parental_Guidelines TV Parental Guidelines} for more details.
 */
export const ShowContentRating = z
  .enum(MediaItemContentRating)
  .extract(["TV_Y", "TV_Y7", "TV_G", "TV_PG", "TV_14", "TV_MA", "unknown"]);

export type ShowContentRating = z.infer<typeof ShowContentRating>;

registerEnumType(ShowContentRating.enum, {
  name: "ShowContentRating",
  description:
    "The content rating of a TV show, based on the TV Parental Guidelines. See https://en.wikipedia.org/wiki/TV_Parental_Guidelines for more details.",
});

import { registerEnumType } from "type-graphql";
import z from "zod";

export const MediaItemContentRating = z.enum([
  "g",
  "pg",
  "pg_13",
  "r",
  "nc_17",
  "tv_y",
  "tv_y7",
  "tv_g",
  "tv_pg",
  "tv_14",
  "tv_ma",
  "unknown",
]);

export type MediaItemContentRating = z.infer<typeof MediaItemContentRating>;

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
export const MovieContentRating = MediaItemContentRating.extract([
  "g",
  "pg",
  "pg_13",
  "r",
  "nc_17",
  "unknown",
]);

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
export const ShowContentRating = MediaItemContentRating.extract([
  "tv_y",
  "tv_y7",
  "tv_g",
  "tv_pg",
  "tv_14",
  "tv_ma",
  "unknown",
]);

export type ShowContentRating = z.infer<typeof ShowContentRating>;

registerEnumType(ShowContentRating.enum, {
  name: "ShowContentRating",
  description:
    "The content rating of a TV show, based on the TV Parental Guidelines. See https://en.wikipedia.org/wiki/TV_Parental_Guidelines for more details.",
});

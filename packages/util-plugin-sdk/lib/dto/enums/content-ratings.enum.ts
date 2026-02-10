import { constantCase } from "es-toolkit";
import { registerEnumType } from "type-graphql";
import z from "zod";

export const MediaItemContentRating = z.enum([
  "g",
  "pg",
  "pg-13",
  "r",
  "nc-17",
  "tv-y",
  "tv-y7",
  "tv-g",
  "tv-pg",
  "tv-14",
  "tv-ma",
  "unknown",
]);

export type MediaItemContentRating = z.infer<typeof MediaItemContentRating>;

export const MediaItemContentRatingEnum = Object.fromEntries(
  Object.entries(MediaItemContentRating.enum).map(
    ([key, value]) => [constantCase(key), value] as const,
  ),
);

registerEnumType(MediaItemContentRatingEnum, {
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
  "pg-13",
  "r",
  "nc-17",
  "unknown",
]);

export type MovieContentRating = z.infer<typeof MovieContentRating>;

export const MovieContentRatingEnum = Object.fromEntries(
  Object.entries(MovieContentRating.enum).map(
    ([key, value]) => [constantCase(key), value] as const,
  ),
);

registerEnumType(MovieContentRatingEnum, {
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
  "tv-y",
  "tv-y7",
  "tv-g",
  "tv-pg",
  "tv-14",
  "tv-ma",
  "unknown",
]);

export type ShowContentRating = z.infer<typeof ShowContentRating>;

export const ShowContentRatingEnum = Object.fromEntries(
  Object.entries(ShowContentRating.enum).map(
    ([key, value]) => [constantCase(key), value] as const,
  ),
);

registerEnumType(ShowContentRatingEnum, {
  name: "ShowContentRating",
  description:
    "The content rating of a TV show, based on the TV Parental Guidelines. See https://en.wikipedia.org/wiki/TV_Parental_Guidelines for more details.",
});

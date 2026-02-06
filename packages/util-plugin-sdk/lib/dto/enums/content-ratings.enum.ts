import { registerEnumType } from "type-graphql";
import z from "zod";

const MediaItemContentRating = z.enum([
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
  "TV-Y",
  "TV-Y7",
  "TV-G",
  "TV-PG",
  "TV-14",
  "TV-MA",
  "Unknown",
]);

/**
 * The content rating of a movie, based on the MPAA rating system.
 *
 * See https://en.wikipedia.org/wiki/MPAA_film_rating_system for more details.
 */
export const MovieContentRating = MediaItemContentRating.extract([
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
  "Unknown",
]);

export type MovieContentRating = z.infer<typeof MovieContentRating>;

registerEnumType(MovieContentRating.enum, {
  name: "MovieContentRating",
  description: "The content rating of a movie",
});

/**
 * The content rating of a TV show, based on the TV Parental Guidelines.
 *
 * See https://en.wikipedia.org/wiki/TV_Parental_Guidelines for more details.
 */
export const ShowContentRating = MediaItemContentRating.extract([
  "TV-Y",
  "TV-Y7",
  "TV-G",
  "TV-PG",
  "TV-14",
  "TV-MA",
  "Unknown",
]);

export type ShowContentRating = z.infer<typeof ShowContentRating>;

registerEnumType(ShowContentRating.enum, {
  name: "ShowContentRating",
  description:
    "The content rating of a TV show, based on the TV Parental Guidelines. See https://en.wikipedia.org/wiki/TV_Parental_Guidelines for more details.",
});

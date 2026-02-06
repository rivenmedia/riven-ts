import { registerEnumType } from "type-graphql";
import z from "zod";

export const MediaItemContentRating = z.enum([
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

export type MediaItemContentRating = z.infer<typeof MediaItemContentRating>;

registerEnumType(MediaItemContentRating.enum, {
  name: "MediaItemContentRating",
  description: "The content rating of a media item",
});

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
  description: "The content rating of a TV show",
});

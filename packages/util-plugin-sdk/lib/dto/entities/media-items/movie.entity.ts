import { Entity, Enum } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import z from "zod";

import { MovieContentRatingEnum } from "../../enums/content-ratings.enum.ts";
import { MediaItem } from "./media-item.entity.ts";

export const MovieContentRating = z.enum([
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
  "Unknown",
]);

export type MovieContentRating = z.infer<typeof MovieContentRating>;

@ObjectType()
@Entity()
export class Movie extends MediaItem {
  constructor() {
    super();

    this.type = "movie";
  }

  @Field(() => MovieContentRatingEnum)
  @Enum()
  declare contentRating: MovieContentRating;
}

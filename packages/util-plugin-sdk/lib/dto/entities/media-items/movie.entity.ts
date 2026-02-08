import { Entity, Enum, type Opt } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import {
  type MovieContentRating,
  MovieContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaItem } from "./media-item.entity.ts";

@ObjectType()
@Entity()
export class Movie extends MediaItem {
  @Field(() => MovieContentRatingEnum)
  @Enum()
  declare contentRating: MovieContentRating;

  override type: Opt<"movie"> = "movie" as const;
}

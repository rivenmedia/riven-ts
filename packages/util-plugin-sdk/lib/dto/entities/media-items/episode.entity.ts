import { Entity, Enum, ManyToOne, Property, type Ref } from "@mikro-orm/core";
import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";

import { ShowContentRating } from "../../enums/content-ratings.enum.ts";
import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";

@ObjectType()
@Entity()
export class Episode extends MediaItem {
  constructor() {
    super();

    this.type = "episode";
  }

  @Field()
  @Property()
  @Min(1)
  number!: number;

  @Field({ nullable: true })
  @Property()
  absoluteNumber?: number;

  @Field(() => Season)
  @ManyToOne()
  season!: Ref<Season>;

  @Field(() => ShowContentRating)
  @Enum({ items: ShowContentRating.options })
  declare contentRating: ShowContentRating;
}

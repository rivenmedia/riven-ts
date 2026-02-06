import { Collection, Entity, Enum, OneToMany, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import { ShowContentRating } from "../../enums/content-ratings.enum.ts";
import { ShowStatus } from "../../enums/show-status.enum.js";
import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";

@ObjectType()
@Entity()
export class Show extends MediaItem {
  constructor() {
    super();

    this.type = "show";
  }

  @Field(() => ShowStatus.enum, { nullable: true })
  @Enum()
  status!: ShowStatus;

  @Field(() => String)
  @Property({ type: "json" })
  releaseData!: object;

  @Field(() => [Season], { nullable: true })
  @OneToMany(() => Season, (season) => season.parent)
  seasons = new Collection<Season>(this);

  @Field(() => ShowContentRating)
  @Enum()
  declare contentRating: ShowContentRating;
}

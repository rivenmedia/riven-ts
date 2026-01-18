import { Entity, ManyToOne, Property, type Ref } from "@mikro-orm/core";
import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";

import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";

@ObjectType()
@Entity()
export class Episode extends MediaItem {
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
}

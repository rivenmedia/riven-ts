import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import { ChildEntity, Column, ManyToOne, type Relation } from "typeorm";

import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";

@ObjectType()
@ChildEntity()
export class Episode extends MediaItem {
  @Field()
  @Column()
  @Min(1)
  number!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  absoluteNumber?: number;

  @Field(() => Season)
  @ManyToOne(() => Season, (season) => season.episodes)
  season!: Relation<Season>;
}

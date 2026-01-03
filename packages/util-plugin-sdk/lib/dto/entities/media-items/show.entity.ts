import { Field, ObjectType } from "type-graphql";
import { ChildEntity, Column, OneToMany, type Relation } from "typeorm";

import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";

@ObjectType()
@ChildEntity()
export class Show extends MediaItem {
  @Field({ nullable: true })
  @Column({ nullable: true })
  tvdbStatus?: string;

  @Field(() => String)
  @Column("json")
  releaseData!: object;

  @Field(() => [Season], { nullable: true })
  @OneToMany(() => Season, (season) => season.parent, { nullable: true })
  seasons?: Relation<Season>[];
}

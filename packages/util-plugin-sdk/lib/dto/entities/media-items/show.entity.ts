import { Collection, Entity, OneToMany, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import { MediaItem } from "./media-item.entity.ts";
import { Season } from "./season.entity.ts";

@ObjectType()
@Entity()
export class Show extends MediaItem {
  @Field({ nullable: true })
  @Property()
  tvdbStatus?: string;

  @Field(() => String)
  @Property({ type: "json" })
  releaseData!: object;

  @Field(() => [Season], { nullable: true })
  @OneToMany(() => Season, (season) => season.parent)
  seasons = new Collection<Season>(this);

  override type = "show" as const;
}

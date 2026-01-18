import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, ID, ObjectType } from "type-graphql";

import { MediaItem } from "../media-items/media-item.entity.ts";

@ObjectType()
@Entity()
export class Stream {
  @Field(() => ID)
  @PrimaryKey()
  id!: number;

  @Field()
  @Property()
  infoHash!: string;

  @Field()
  @Property()
  rawTitle!: string;

  @Field()
  @Property()
  parsedTitle!: string;

  @Field()
  @Property()
  rank!: number;

  @Field({ nullable: true })
  @Property()
  levRatio?: number;

  @Field(() => [MediaItem])
  @ManyToMany()
  parents = new Collection<MediaItem>(this);

  @Field(() => [MediaItem])
  @ManyToMany()
  blacklistedParents = new Collection<MediaItem>(this);
}

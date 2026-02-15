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

  @Field(() => String)
  @Property()
  infoHash!: string;

  @Field(() => String)
  @Property()
  rawTitle!: string;

  @Field(() => String)
  @Property()
  parsedTitle!: string;

  @Field(() => String)
  @Property()
  rank!: number;

  @Field(() => Number, { nullable: true })
  @Property()
  levRatio?: number;

  @Field(() => [MediaItem])
  @ManyToMany()
  parents = new Collection<MediaItem>(this);

  @Field(() => [MediaItem])
  @ManyToMany()
  blacklistedParents = new Collection<MediaItem>(this);
}

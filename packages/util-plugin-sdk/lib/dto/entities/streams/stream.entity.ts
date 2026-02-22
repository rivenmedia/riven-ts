import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, ID, ObjectType } from "type-graphql";

import { MediaItem } from "../media-items/media-item.entity.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

@ObjectType()
@Entity()
export class Stream {
  @Field(() => ID)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property()
  infoHash!: string;

  @Property({ type: "json" })
  parsedData!: ParsedData;

  @Field(() => [MediaItem])
  @ManyToMany()
  parents = new Collection<MediaItem>(this);

  @Field(() => [MediaItem])
  @ManyToMany()
  blacklistedParents = new Collection<MediaItem>(this);
}

import { Collection } from "@mikro-orm/core";
import {
  Entity,
  ManyToMany,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { Field, ObjectType } from "type-graphql";

import { Node } from "../core/node.entity.ts";
import { MediaItem } from "../media-items/media-item.entity.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

@ObjectType({ implements: Node })
@Entity()
export class Stream extends Node {
  @Field(() => String)
  @Property()
  @Unique()
  infoHash!: string;

  @Property({ type: "json" })
  parsedData!: ParsedData;

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.streams)
  parents = new Collection<MediaItem>(this);

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.blacklistedStreams)
  blacklistedParents = new Collection<MediaItem>(this);
}

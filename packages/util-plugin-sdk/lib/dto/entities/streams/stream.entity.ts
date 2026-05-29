import {
  Collection,
  EntityRepositoryType,
  PrimaryKeyProp,
} from "@mikro-orm/core";
import {
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { Field, ID, ObjectType } from "type-graphql";

import { StreamRepository } from "../../repositories/stream.repository.ts";
import { MediaItem } from "../media-items/media-item.entity.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

@ObjectType()
@Entity({ repository: () => StreamRepository })
export class Stream {
  [PrimaryKeyProp]!: "infoHash";

  [EntityRepositoryType]?: StreamRepository;

  @Field(() => ID)
  @PrimaryKey()
  infoHash!: string;

  @Property({ type: "json" })
  parsedData!: ParsedData;

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem, "streams")
  parents = new Collection<MediaItem>(this);
}

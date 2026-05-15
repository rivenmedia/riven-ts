import { Collection, EntityRepositoryType } from "@mikro-orm/core";
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
  [EntityRepositoryType]?: StreamRepository;

  @Field(() => ID)
  @PrimaryKey()
  infoHash!: string;

  /** GraphQL alias for {@link infoHash} so clients can use a stable `id`. */
  @Field(() => ID)
  get id(): string {
    return this.infoHash;
  }

  @Property({ type: "json" })
  parsedData!: ParsedData;

  /** Human-readable title extracted from the torrent name during ranking. */
  @Field(() => String, { nullable: true })
  get title(): string | null {
    return this.parsedData.title;
  }

  /** Quality marker (e.g. "1080p") from the parsed torrent name. */
  @Field(() => String, { nullable: true })
  get quality(): string | null {
    return this.parsedData.quality ?? null;
  }

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.streams)
  parents = new Collection<MediaItem>(this);

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.blacklistedStreams)
  blacklistedParents = new Collection<MediaItem>(this);
}

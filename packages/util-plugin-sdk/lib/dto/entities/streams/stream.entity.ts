import { Collection, EntityRepositoryType } from "@mikro-orm/core";
import {
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { BigIntResolver } from "graphql-scalars";
import { Field, ID, Int, ObjectType } from "type-graphql";

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

  /**
   * Torrent payload size in bytes, as reported by the scraper response.
   *
   * Nullable because not every scraper / indexer surfaces a size; callers
   * MUST tolerate `null` and never fabricate a value from the parsed title.
   */
  @Field(() => BigIntResolver, { nullable: true })
  @Property({ type: "bigint", nullable: true })
  size: number | null = null;

  /**
   * Seeder count as reported by the scraper response.
   *
   * Nullable because not every scraper / indexer surfaces seeder counts.
   */
  @Field(() => Int, { nullable: true })
  @Property({ type: "integer", nullable: true })
  seeders: number | null = null;

  /**
   * Leecher count as reported by the scraper response.
   *
   * Nullable because not every scraper / indexer surfaces leecher counts
   * (e.g. Torrentio's Stremio response omits leechers entirely).
   */
  @Field(() => Int, { nullable: true })
  @Property({ type: "integer", nullable: true })
  leechers: number | null = null;

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.streams)
  parents = new Collection<MediaItem>(this);

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.blacklistedStreams)
  blacklistedParents = new Collection<MediaItem>(this);
}

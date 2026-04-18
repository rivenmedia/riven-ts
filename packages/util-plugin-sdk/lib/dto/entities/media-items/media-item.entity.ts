import {
  Collection,
  type Hidden,
  type Opt,
  OptionalProps,
  type Ref,
} from "@mikro-orm/core";
import {
  Entity,
  Enum,
  Index,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { IsOptional, Matches } from "class-validator";
import { JSONObjectResolver } from "graphql-scalars";
import { DateTime } from "luxon";
import { type UUID, randomUUID } from "node:crypto";
import { Field, ID, InterfaceType } from "type-graphql";

import { MediaItemContentRating } from "../../enums/content-ratings.enum.ts";
import { MediaItemState } from "../../enums/media-item-state.enum.ts";
import { MediaItemType } from "../../enums/media-item-type.enum.ts";
import { FileSystemEntry, SubtitleEntry } from "../filesystem/index.ts";
import { ItemRequest, MediaEntry } from "../index.ts";
import { Stream } from "../streams/stream.entity.ts";

import type { Promisable } from "type-fest";

@InterfaceType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
@Index({ properties: ["type", "releaseDate"] })
export abstract class MediaItem {
  [OptionalProps]?: "state";

  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  id: UUID = randomUUID();

  @Field(() => String)
  @Index()
  @Property()
  title!: string;

  @Field(() => String)
  @Property()
  fullTitle!: Opt<string>;

  @Field(() => String, { nullable: true })
  @Property()
  @Matches(/^tt\d+$/)
  @IsOptional()
  imdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  posterPath?: string | null;

  @Field(() => Date)
  @Index()
  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property({ onUpdate: () => DateTime.now().toJSDate() })
  updatedAt?: Opt<Date> | null;

  @Field(() => Date, { nullable: true })
  @Property()
  indexedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  @Property()
  scrapedAt?: Date | null;

  @Field(() => Number)
  @Property({ default: 0 })
  scrapedTimes!: Opt<number>;

  @Field(() => JSONObjectResolver, { nullable: true })
  @Property({ nullable: true, type: "json" })
  aliases?: Record<string, string[]> | null;

  @Field(() => Boolean)
  @Property({ persist: false, hidden: true })
  get isAnime(): Opt<Hidden<boolean>> {
    return (
      this.language !== "en" &&
      ["animation", "anime"].every((genre) =>
        this.genres?.map((g) => g.toLowerCase()).includes(genre),
      )
    );
  }

  @Field(() => String, { nullable: true })
  @Property()
  network?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  country?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  language?: string | null;

  @Field(() => Date, { nullable: true })
  @Property()
  releaseDate!: Date | null;

  @Field(() => Number, { nullable: true })
  @Property()
  year?: number | null;

  @Field(() => [String], { nullable: true })
  @Property()
  genres?: string[] | null;

  @Field(() => Number, { nullable: true })
  @Property()
  rating?: number | null;

  @Enum(() => MediaItemContentRating.enum)
  contentRating?: MediaItemContentRating | null;

  @Field(() => String, { nullable: true })
  @Property()
  guid?: string | null;

  @Field(() => MediaItemState.enum)
  @Enum({
    default: MediaItemState.enum.indexed,
    items: () => MediaItemState.enum,
  })
  state!: MediaItemState;

  @Field(() => Number)
  @Property()
  failedAttempts: Opt<number> = 0;

  @Field(() => [FileSystemEntry])
  @ManyToMany()
  filesystemEntries: Collection<FileSystemEntry> =
    new Collection<FileSystemEntry>(this);

  @Field(() => [SubtitleEntry])
  @ManyToMany()
  subtitles: Collection<SubtitleEntry> = new Collection<SubtitleEntry>(this);

  @Field(() => Stream, { nullable: true })
  @ManyToOne()
  activeStream?: Ref<Stream> | null;

  @Field(() => [Stream])
  @ManyToMany()
  streams: Collection<Stream> = new Collection<Stream>(this);

  @Field(() => [Stream])
  @ManyToMany()
  blacklistedStreams: Collection<Stream> = new Collection<Stream>(this);

  @Field(() => String)
  @Enum(() => MediaItemType.enum)
  type!: MediaItemType;

  @ManyToOne(() => ItemRequest)
  itemRequest!: Ref<ItemRequest>;

  @Property()
  isRequested!: boolean;

  /**
   * Determines if the media item is considered to be released based on its release date.
   *
   * Returns true if the release date is in the past, false if it's in the future or not available.
   */
  @Property({ persist: false, getter: true })
  get isReleased(): Opt<boolean> {
    return this.releaseDate
      ? DateTime.fromJSDate(this.releaseDate) <= DateTime.now()
      : false;
  }

  /**
   * A pretty name for the media item to be used in VFS paths.
   *
   * @example "Inception (2010) {tmdb-27205}"
   */
  abstract getPrettyName(): Promisable<string>;

  /**
   * Gets all media entries associated with this media item.
   *
   * This is determined by picking all MediaEntries from the filesystem entries.
   *
   * The amount of entries returned varies based on the media item type.
   * For movies and episodes, this will return a maximum of 1 entry,
   * but for shows and seasons, it will return all media entries from all descendant episodes.
   *
   * @see {@link MediaEntry}
   * @returns An array of associated MediaEntries, which may be empty if none exist.
   */
  abstract getMediaEntries(): Promise<MediaEntry[]>;

  /**
   * Returns the minimum amount of files that must be returned from a torrent
   * in order to satisfy this media item.
   *
   * @returns A positive integer representing the expected file count for this media item.
   */
  abstract getExpectedFileCount(): Promisable<number>;
}

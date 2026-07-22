import { Collection, OptionalProps } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { IsOptional, Matches } from "class-validator";
import { JSONObjectResolver } from "graphql-scalars";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { Field, ID, InterfaceType } from "type-graphql";

import { MediaItemContentRating } from "../../enums/content-ratings.enum.ts";
import { MediaItemState } from "../../enums/media-item-state.enum.ts";
import { MediaItemType } from "../../enums/media-item-type.enum.ts";
import { FileSystemEntry, SubtitleEntry } from "../filesystem/index.ts";
import { BlacklistedStream, ItemRequest } from "../index.ts";
import { Stream } from "../streams/stream.entity.ts";

import type { MediaEntry } from "../index.ts";
import type { Hidden, Opt, Ref } from "@mikro-orm/core";
import type { UUID } from "node:crypto";
import type { Promisable } from "type-fest";

@InterfaceType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
@Index({ properties: ["type", "releaseDate"] })
export abstract class MediaItem {
  public [OptionalProps]?: "state";

  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id: UUID = randomUUID();

  @Field(() => String)
  @Index()
  @Property()
  public title!: string;

  @Field(() => String)
  @Property()
  public fullTitle!: Opt<string>;

  @Field(() => String, { nullable: true })
  @Property({ type: "varchar", length: 10 })
  @Matches(/^tt\d+$/u)
  @IsOptional()
  public imdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  public posterPath?: string | null;

  @Field(() => Date)
  @Index()
  @Property()
  public createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  public updatedAt?: Opt<Date> | null;

  @Field(() => Date)
  @Property()
  public indexedAt!: Date;

  @Field(() => Date, { nullable: true })
  @Property()
  public scrapedAt?: Date | null;

  @Field(() => Number)
  @Property({ default: 0 })
  public scrapedTimes!: Opt<number>;

  @Field(() => JSONObjectResolver, { nullable: true })
  @Property({ nullable: true, type: "json" })
  public aliases?: Record<string, string[]> | null;

  @Field(() => Boolean)
  @Property({ persist: false, hidden: true })
  public get isAnime(): Opt<Hidden<boolean>> {
    return (
      this.language !== "en" &&
      ["animation", "anime"].every((genre) =>
        this.genres
          ?.map((genreName) => genreName.toLowerCase())
          .includes(genre),
      )
    );
  }

  @Field(() => String, { nullable: true })
  @Property()
  public network?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  public country?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  public language?: string | null;

  @Field(() => Date, { nullable: true })
  @Property()
  public releaseDate!: Date | null;

  @Field(() => Number, { nullable: true })
  @Property()
  public year?: number | null;

  @Field(() => [String], { nullable: true })
  @Property()
  public genres?: string[] | null;

  @Field(() => Number, { nullable: true })
  @Property()
  public rating?: number | null;

  @Enum(() => MediaItemContentRating.enum)
  public contentRating?: MediaItemContentRating | null;

  @Field(() => MediaItemState.enum)
  @Enum({
    default: MediaItemState.enum.indexed,
    items: () => MediaItemState.enum,
  })
  public state!: MediaItemState;

  @Field(() => Number)
  @Property()
  public failedScrapeAttempts: Opt<number> = 0;

  @Field(() => [FileSystemEntry])
  @OneToMany({
    entity: () => FileSystemEntry,
    mappedBy: "mediaItem",
    orphanRemoval: true,
  })
  public filesystemEntries = new Collection<FileSystemEntry>(this);

  @Field(() => [SubtitleEntry])
  @ManyToMany()
  public subtitles = new Collection<SubtitleEntry>(this);

  @Field(() => Stream, { nullable: true })
  @ManyToOne()
  public activeStream?: Ref<Stream> | null;

  @Field(() => [Stream])
  @ManyToMany(() => Stream)
  public streams = new Collection<Stream>(this);

  @Field(() => [BlacklistedStream])
  @OneToMany(() => BlacklistedStream, "mediaItem")
  public blacklistedStreams = new Collection<BlacklistedStream>(this);

  @Field(() => String)
  @Enum(() => MediaItemType.enum)
  public type!: MediaItemType;

  @ManyToOne(() => ItemRequest)
  public itemRequest!: Ref<ItemRequest>;

  @Property()
  public isRequested!: boolean;

  /**
   * Determines if the media item is considered to be released based on its release date.
   *
   * Returns true if the release date is in the past, false if it's in the future or not available.
   */
  @Property({ persist: false, getter: true })
  public get isReleased(): Opt<boolean> {
    return this.releaseDate
      ? DateTime.fromJSDate(this.releaseDate) <= DateTime.utc()
      : false;
  }

  /**
   * Resets a media item back to its original state.
   *
   * Used after blacklisting a stream to indicate a fresh processing attempt can be started.
   */
  public reset() {
    this.activeStream = null;
    this.failedScrapeAttempts = 0;
    this.scrapedTimes = 0;
    this.scrapedAt = null;
    this.filesystemEntries.removeAll();
    this.streams.removeAll();
    this.subtitles.removeAll();
  }

  /**
   * A pretty name for the media item to be used in VFS paths.
   *
   * @example "Inception (2010) {tmdb-27205}"
   */
  public abstract getPrettyName(): Promisable<string>;

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
  public abstract getMediaEntries(): Promise<MediaEntry[]>;

  /**
   * Returns the minimum amount of files that must be returned from a torrent
   * in order to satisfy this media item.
   *
   * @returns A positive integer representing the expected file count for this media item.
   */
  public abstract getExpectedFileCount(): Promisable<number>;

  /**
   * @returns Any incomplete immediate children of this media item.
   */
  public abstract getIncompleteItems(): Promisable<MediaItem[]>;
}

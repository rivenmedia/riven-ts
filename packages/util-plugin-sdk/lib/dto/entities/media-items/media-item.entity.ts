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
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { DateTime } from "luxon";
import { Field, ID, Int, ObjectType } from "type-graphql";

import {
  MediaItemContentRating,
  MediaItemContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaItemState } from "../../enums/media-item-state.enum.ts";
import { MediaItemType } from "../../enums/media-item-type.enum.ts";
import { FileSystemEntry } from "../filesystem/filesystem-entry.entity.ts";
import { SubtitleEntry } from "../filesystem/subtitle-entry.entity.ts";
import { ItemRequest, MediaEntry } from "../index.ts";
import { Stream } from "../streams/stream.entity.ts";

import type { Promisable } from "type-fest";

@ObjectType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
@Index({ properties: ["type", "releaseDate"] })
export abstract class MediaItem {
  [OptionalProps]?: "state";

  @Field((_type) => ID)
  @PrimaryKey()
  id!: number;

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
  @IsNumberString()
  @IsOptional()
  tvdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  @IsNumberString()
  @IsOptional()
  tmdbId?: string | null;

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

  @Field(() => Int)
  @Property({ default: 0 })
  scrapedTimes!: Opt<number>;

  @Field(() => String, { nullable: true })
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

  @Field(() => Int, { nullable: true })
  @Property()
  year?: number | null;

  @Field(() => [String], { nullable: true })
  @Property()
  genres?: string[] | null;

  @Field(() => Number, { nullable: true })
  @Property()
  rating?: number | null;

  @Field(() => MediaItemContentRatingEnum, { nullable: true })
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

  @Field(() => Int)
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

  @Field(() => ItemRequest)
  @ManyToOne(() => ItemRequest)
  itemRequest!: Ref<ItemRequest>;

  @Field(() => Boolean)
  @Property()
  isRequested!: boolean;

  /**
   * Determines if the media item is considered to be released based on its release date.
   *
   * Returns true if the release date is in the past, false if it's in the future or not available.
   */
  @Field(() => Boolean)
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
}

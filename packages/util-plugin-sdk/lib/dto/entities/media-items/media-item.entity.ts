import {
  Collection,
  Entity,
  Enum,
  type Hidden,
  Index,
  ManyToMany,
  ManyToOne,
  type Opt,
  PrimaryKey,
  Property,
  type Ref,
  Unique,
} from "@mikro-orm/core";
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { z } from "zod";

import {
  MediaItemContentRating,
  MediaItemContentRatingEnum,
} from "../../enums/content-ratings.enum.js";
import { FileSystemEntry } from "../filesystem/filesystem-entry.entity.ts";
import { SubtitleEntry } from "../filesystem/subtitle-entry.entity.ts";
import { Stream } from "../streams/stream.entity.ts";

import type { MediaEntry } from "../index.ts";

export const MediaItemState = z.enum([
  "Unknown",
  "Unreleased",
  "Ongoing",
  "Requested",
  "Indexed",
  "Scraped",
  "Downloaded",
  "Symlinked",
  "Completed",
  "PartiallyCompleted",
  "Failed",
  "Paused",
]);

export type MediaItemState = z.infer<typeof MediaItemState>;

registerEnumType(MediaItemState.enum, {
  name: "MediaItemState",
  description: "The state of a media item in the processing pipeline",
});

export const MediaItemType = z.enum([
  "movie",
  "show",
  "season",
  "episode",
  "requested_item",
]);

export type MediaItemType = z.infer<typeof MediaItemType>;

registerEnumType(MediaItemType.enum, {
  name: "MediaItemType",
  description: "The type of a media item",
});

@ObjectType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
  discriminatorMap: {
    movie: "Movie",
    show: "Show",
    season: "Season",
    episode: "Episode",
    requested_item: "RequestedItem",
  },
})
@Index({ properties: ["type", "airedAt"] })
export abstract class MediaItem {
  @Field((_type) => ID)
  @PrimaryKey()
  id!: number & Opt;

  @Field(() => String, { nullable: true })
  @Index()
  @Property()
  title?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  @Matches(/^tt\d+$/)
  @IsOptional()
  @Unique()
  imdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  @IsNumberString()
  @IsOptional()
  @Unique()
  tvdbId?: string | null;

  @Field({ nullable: true })
  @Property()
  @IsNumberString()
  @IsOptional()
  @Unique()
  tmdbId?: string;

  @Field({ nullable: true })
  @Property()
  posterPath?: string;

  @Field(() => Date)
  @Index()
  @Property()
  requestedAt: Date & Opt = new Date();

  @Field({ nullable: true })
  @Property()
  requestedBy?: string;

  @Field({ nullable: true })
  @Property()
  requestedId?: string;

  @Field({ nullable: true })
  @Property()
  indexedAt?: Date;

  @Field({ nullable: true })
  @Property()
  scrapedAt?: Date;

  @Field()
  @Property({ default: 0 })
  scrapedTimes!: number;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true, type: "json" })
  aliases?: Record<string, string[]>;

  @Field()
  @Property({ default: false })
  isAnime!: boolean;

  @Field({ nullable: true })
  @Property()
  network?: string;

  @Field({ nullable: true })
  @Property()
  country?: string;

  @Field({ nullable: true })
  @Property()
  language?: string;

  @Field({ nullable: true })
  @Property()
  airedAt?: Date;

  @Field({ nullable: true })
  @Property()
  year?: number;

  @Field(() => [String], { nullable: true })
  @Property()
  genres?: string[];

  @Field({ nullable: true })
  @Property()
  rating?: number;

  @Field(() => MediaItemContentRatingEnum, { nullable: true })
  @Property()
  contentRating?: MediaItemContentRating;

  @Field(() => Boolean)
  @Property({ default: false })
  updated!: boolean & Opt;

  @Field({ nullable: true })
  @Property()
  guid?: string;

  @Property()
  overseerrId?: number;

  @Field(() => MediaItemState.enum)
  @Enum(() => MediaItemState.enum)
  state!: MediaItemState;

  @Field(() => Number)
  @Property()
  failedAttempts: number & Opt = 0;

  @Field(() => [FileSystemEntry])
  @ManyToMany()
  filesystemEntries: Collection<FileSystemEntry> & Opt =
    new Collection<FileSystemEntry>(this);

  @Field(() => [SubtitleEntry])
  @ManyToMany()
  subtitles: Collection<SubtitleEntry> & Opt = new Collection<SubtitleEntry>(
    this,
  );

  @Field(() => Stream, { nullable: true })
  @ManyToOne()
  activeStream?: Ref<Stream>;

  @Field(() => [Stream])
  @ManyToMany({ owner: true })
  streams: Collection<Stream> & Opt = new Collection<Stream>(this);

  @Field(() => [Stream])
  @ManyToMany()
  blacklistedStreams: Collection<Stream> & Opt = new Collection<Stream>(this);

  @Field(() => String)
  @Enum()
  type!: MediaItemType & Opt;

  /**
   * A pretty name for the media item to be used in VFS paths.
   *
   * @example "Inception (2010) {tmdb-27205}"
   */
  @Property({ persist: false, hidden: true })
  get prettyName(): Hidden<string> | undefined {
    if (!this.title || !this.year || !this.tmdbId) {
      return;
    }

    return `${this.title} (${this.year.toString()}) {tmdb-${this.tmdbId}}`;
  }

  /**
   * The media entry associated with this media item, if any.
   *
   * This is determined by picking the first MediaEntry from the filesystem entries.
   *
   * _Usually_ there should only be one media entry per media item.
   *
   * @see {@link MediaEntry}
   * @returns The associated MediaEntry or undefined if none exists.
   */
  get mediaEntry(): Hidden<MediaEntry> | undefined {
    return this.filesystemEntries
      .getItems()
      .find((entry) => entry.type === "media") as MediaEntry | undefined;
  }
}

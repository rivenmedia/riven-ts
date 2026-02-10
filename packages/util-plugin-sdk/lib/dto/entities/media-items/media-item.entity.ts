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

export const MediaItemType = z.enum(["movie", "show", "season", "episode"]);

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
  },
})
@Index({ properties: ["type", "airedAt"] })
export abstract class MediaItem {
  @Field((_type) => ID)
  @PrimaryKey()
  id!: Opt<number>;

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
  createdAt: Opt<Date> = new Date();

  @Field(() => Date, { nullable: true })
  @Property({ onUpdate: () => new Date() })
  updatedAt?: Opt<Date>;

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

  @Field(() => Number)
  @Property({ default: 0 })
  scrapedTimes!: Opt<number>;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true, type: "json" })
  aliases?: Record<string, string[]>;

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
  @Enum(() => MediaItemContentRating.enum)
  contentRating?: MediaItemContentRating;

  @Field(() => Boolean)
  @Property({ default: false })
  updated!: Opt<boolean>;

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
  failedAttempts: Opt<number> = 0;

  @Field(() => [FileSystemEntry])
  @ManyToMany({ owner: true })
  filesystemEntries: Collection<FileSystemEntry> =
    new Collection<FileSystemEntry>(this);

  @Field(() => [SubtitleEntry])
  @ManyToMany({ owner: true })
  subtitles: Collection<SubtitleEntry> = new Collection<SubtitleEntry>(this);

  @Field(() => Stream, { nullable: true })
  @ManyToOne()
  activeStream?: Ref<Stream>;

  @Field(() => [Stream])
  @ManyToMany({ owner: true })
  streams: Collection<Stream> = new Collection<Stream>(this);

  @Field(() => [Stream])
  @ManyToMany({ owner: true })
  blacklistedStreams: Collection<Stream> = new Collection<Stream>(this);

  @Field(() => String)
  @Enum(() => MediaItemType.enum)
  type!: MediaItemType;

  /**
   * A pretty name for the media item to be used in VFS paths.
   *
   * @example "Inception (2010) {tmdb-27205}"
   */
  @Property({ persist: false, hidden: true })
  get prettyName(): Opt<Hidden<string>> | undefined {
    if (
      !this.title ||
      !this.year ||
      (this.type === "movie" ? !this.tmdbId : !this.tvdbId)
    ) {
      return;
    }

    const externalIdentifier =
      this.type === "movie"
        ? `tmdb-${String(this.tmdbId)}`
        : `tvdb-${String(this.tvdbId)}`;

    return `${this.title} (${this.year.toString()}) {${externalIdentifier}}`;
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

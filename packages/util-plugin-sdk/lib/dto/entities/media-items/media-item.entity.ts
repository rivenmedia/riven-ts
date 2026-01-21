import {
  Collection,
  Entity,
  Enum,
  Index,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  type Ref,
  Unique,
} from "@mikro-orm/core";
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { z } from "zod";

import { BaseEntity } from "../entity.ts";
import { FileSystemEntry } from "../filesystem/filesystem-entry.entity.ts";
import { SubtitleEntry } from "../filesystem/subtitle-entry.entity.ts";
import { Stream } from "../streams/stream.entity.ts";

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
export abstract class MediaItem extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryKey()
  id!: number;

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

  @Field()
  @Index()
  @Property()
  requestedAt: Date = new Date();

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

  @Field({ nullable: true })
  @Property()
  contentRating?: string;

  @Field()
  @Property({ default: false })
  updated!: boolean;

  @Field({ nullable: true })
  @Property()
  guid?: string;

  @Property()
  overseerrId?: number;

  @Field(() => MediaItemState.enum)
  @Enum(() => MediaItemState.enum)
  state!: MediaItemState;

  @Field()
  @Property({ default: 0 })
  failedAttempts!: number;

  @Field(() => [FileSystemEntry])
  @ManyToMany()
  filesystemEntries = new Collection<FileSystemEntry>(this);

  @Field(() => [SubtitleEntry])
  @ManyToMany()
  subtitles = new Collection<SubtitleEntry>(this);

  @Field(() => Stream, { nullable: true })
  @ManyToOne()
  activeStream?: Ref<Stream>;

  @Field(() => [Stream])
  @ManyToMany({ owner: true })
  streams = new Collection<Stream>(this);

  @Field(() => [Stream])
  @ManyToMany()
  blacklistedStreams = new Collection<Stream>(this);

  @Field(() => String)
  @Enum()
  type!: MediaItemType;

  @Property({ persist: false })
  get path() {
    if (!this.title || !this.year || !this.tmdbId) {
      return;
    }

    return `${this.title} (${this.year.toString()}) {tmdb-${this.tmdbId}}`;
  }
}

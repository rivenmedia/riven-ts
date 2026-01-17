import { IsNumberString, IsOptional, Matches } from "class-validator";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  TableInheritance,
} from "typeorm";
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
  "Movie",
  "Show",
  "Season",
  "Episode",
  "RequestedItem",
]);

export type MediaItemType = z.infer<typeof MediaItemType>;

registerEnumType(MediaItemType.enum, {
  name: "MediaItemType",
  description: "The type of a media item",
});

@ObjectType()
@Entity()
@TableInheritance({
  column: "type",
})
@Index(["type", "airedAt"])
export class MediaItem extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String, { nullable: true })
  @Index()
  @Column("varchar", { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  @Index({ unique: true })
  @Column("varchar", { nullable: true, unique: true })
  @Matches(/^tt\d+$/)
  @IsOptional()
  imdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Index({ unique: true })
  @Column("varchar", { nullable: true, unique: true })
  @IsNumberString()
  @IsOptional()
  tvdbId?: string | null;

  @Field({ nullable: true })
  @Index({ unique: true })
  @Column({ nullable: true, unique: true })
  @IsNumberString()
  @IsOptional()
  tmdbId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  posterPath?: string;

  @Field()
  @Index()
  @Column({
    default: () => "CURRENT_TIMESTAMP",
  })
  requestedAt!: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  requestedBy?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  requestedId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  indexedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  scrapedAt?: Date;

  @Field()
  @Column({ default: 0 })
  scrapedTimes!: number;

  @Field(() => String, { nullable: true })
  @Column("json", { nullable: true })
  aliases?: Record<string, string[]>;

  @Field()
  @Column({ default: false })
  isAnime!: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  network?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  language?: string;

  @Field({ nullable: true })
  @Column("date", { nullable: true })
  airedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  year?: number;

  @Field(() => [String], { nullable: true })
  @Column("varchar", { array: true, nullable: true })
  genres?: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  rating?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  contentRating?: string;

  @Field()
  @Column({ default: false })
  updated!: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  guid?: string;

  @Column({ nullable: true })
  overseerrId?: number;

  @Field(() => MediaItemState.enum)
  @Column("simple-enum", { enum: MediaItemState.options })
  state!: MediaItemState;

  @Field()
  @Column({ default: 0 })
  failedAttempts!: number;

  @Field(() => [FileSystemEntry])
  @ManyToMany("FileSystemEntry", (entry: FileSystemEntry) => entry.id)
  @JoinTable()
  filesystemEntries!: Relation<FileSystemEntry>[];

  @Field(() => [SubtitleEntry])
  @ManyToMany(() => SubtitleEntry)
  @JoinTable()
  subtitles!: Relation<SubtitleEntry>[];

  @Field(() => Stream, { nullable: true })
  @ManyToOne(() => Stream, { nullable: true })
  activeStream?: Relation<Stream>;

  @Field(() => [Stream])
  @ManyToMany(() => Stream)
  @JoinTable()
  streams!: Relation<Stream>[];

  @Field(() => [Stream])
  @ManyToMany(() => Stream)
  @JoinTable()
  blacklistedStreams!: Relation<Stream>[];

  @Field(() => String)
  @Column("simple-enum", { enum: MediaItemType.options })
  type!: MediaItemType;

  get path() {
    if (!this.title || !this.year || !this.tmdbId) {
      throw new TypeError("MediaItem is missing title, year, or tmdbId");
    }

    return `${this.title} (${this.year.toString()}) {tmdb-${this.tmdbId}}`;
  }
}

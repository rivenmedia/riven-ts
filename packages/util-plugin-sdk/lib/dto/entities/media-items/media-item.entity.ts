import { IsNumberString, IsOptional, Matches } from "class-validator";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import {
  Column,
  Entity,
  Index,
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

export const mediaItemStateSchema = z.enum([
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

export type MediaItemState = z.infer<typeof mediaItemStateSchema>;

registerEnumType(mediaItemStateSchema.enum, {
  name: "MediaItemState",
  description: "The state of a media item in the processing pipeline",
});

@ObjectType()
@Entity()
@TableInheritance({
  column: {
    type: "varchar",
    name: "type",
  },
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

  @Field(() => Stream, { nullable: true })
  @ManyToOne(() => Stream, { nullable: true })
  activeStream?: Relation<Stream>;

  @Field(() => [Stream])
  @ManyToMany(() => Stream)
  streams!: Relation<Stream>[];

  @Field(() => [Stream])
  @ManyToMany(() => Stream)
  blacklistedStreams!: Relation<Stream>[];

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
  @Column({ nullable: true })
  airedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  year?: number;

  @Field(() => [String], { nullable: true })
  @Column("json", { array: true, nullable: true })
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

  @Field(() => mediaItemStateSchema.enum)
  @Column("simple-enum", { enum: mediaItemStateSchema.options })
  state!: MediaItemState;

  @Field(() => [FileSystemEntry])
  @ManyToMany("FileSystemEntry", (entry: FileSystemEntry) => entry.id)
  filesystemEntries!: Relation<FileSystemEntry>[];

  @Field(() => [SubtitleEntry])
  @ManyToMany(() => SubtitleEntry)
  subtitles!: Relation<SubtitleEntry>[];

  @Field()
  @Column({ default: 0 })
  failedAttempts!: number;
}

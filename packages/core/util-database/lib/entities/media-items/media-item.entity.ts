import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  TableInheritance,
  ManyToMany,
  ManyToOne,
  Index,
  type Relation,
} from "typeorm";
import { Stream } from "../streams/stream.entity.ts";
import type { FileSystemEntry } from "../filesystem/filesystem-entry.entity.ts";
import { SubtitleEntry } from "../filesystem/subtitle-entry.entity.ts";
import z from "zod";

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

@Entity()
@TableInheritance({
  column: {
    type: "varchar",
    name: "type",
  },
})
@Index(["type", "airedAt"])
export class MediaItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  title!: string;

  @Index()
  @Column({ nullable: true })
  imdbId?: string;

  @Index()
  @Column({ nullable: true })
  tvdbId?: string;

  @Index()
  @Column({ nullable: true })
  tmdbId?: string;

  @Column({ nullable: true })
  posterPath?: string;

  @Index()
  @Column({
    default: () => "CURRENT_TIMESTAMP",
  })
  requestedAt!: Date;

  @Column({ nullable: true })
  requestedBy?: string;

  @Column({ nullable: true })
  requestedId?: string;

  @Column({ nullable: true })
  indexedAt?: Date;

  @Column({ nullable: true })
  scrapedAt?: Date;

  @Column({ default: 0 })
  scrapedTimes!: number;

  @ManyToOne(() => Stream, { nullable: true })
  activeStream?: Relation<Stream>;

  @ManyToMany(() => Stream)
  streams!: Relation<Stream>[];

  @ManyToMany(() => Stream)
  blacklistedStreams!: Relation<Stream>[];

  @Column("json", { nullable: true })
  aliases?: Record<string, string[]>;

  @Column({ default: false })
  isAnime!: boolean;

  @Column({ nullable: true })
  network?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  airedAt?: Date;

  @Column({ nullable: true })
  year?: number;

  @Column("json", { array: true, nullable: true })
  genres?: string[];

  @Column({ nullable: true })
  rating?: number;

  @Column({ nullable: true })
  contentRating?: string;

  @Column({ default: false })
  updated!: boolean;

  @Column({ nullable: true })
  guid?: string;

  @Column({ nullable: true })
  overseerrId?: number;

  @Column("enum", { enum: mediaItemStateSchema.options })
  lastState!: MediaItemState;

  @ManyToMany("FileSystemEntry", (entry: FileSystemEntry) => entry.id)
  filesystemEntries!: Relation<FileSystemEntry>[];

  @ManyToMany(() => SubtitleEntry)
  subtitles!: Relation<SubtitleEntry>[];

  @Column({ default: 0 })
  failedAttempts!: number;
}

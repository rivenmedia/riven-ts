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
import { MediaItemState } from "./media-item-state.enum";
import { Stream } from "../streams/stream.entity";
import type { FileSystemEntry } from "../filesystem/filesystem-entry.entity";
import { SubtitleEntry } from "../filesystem/subtitle-entry.entity";
import { MediaItemType } from "./media-item-type.enum";

@Entity()
@TableInheritance({
  column: {
    type: "varchar",
    name: "type",
    enum: ["episode", "season", "show", "movie", "mediaitem"],
  },
})
@Index(["type", "airedAt"])
export class MediaItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  title: string;

  @Index()
  @Column()
  imdbId?: string;

  @Index()
  @Column()
  tvdbId?: string;

  @Index()
  @Column()
  tmdbId?: string;

  @Column()
  posterPath?: string;

  @Index()
  @Column("enum", {
    enum: MediaItemType,
  })
  type: MediaItemType;

  @Index()
  @Column({
    default: () => "CURRENT_TIMESTAMP",
  })
  requestedAt: Date;

  @Column()
  requestedBy?: string;

  @Column()
  requestedId?: string;

  @Column()
  indexedAt?: Date;

  @Column()
  scrapedAt?: Date;

  @Column({ default: 0 })
  scrapedTimes: number;

  @ManyToOne(() => Stream)
  activeStream: Relation<Stream>;

  @ManyToMany(() => Stream)
  streams: Relation<Stream>[];

  @ManyToMany(() => Stream)
  blacklistedStreams: Relation<Stream>[];

  @Column("json")
  aliases?: Record<string, string[]>;

  @Column({ default: false })
  isAnime: boolean;

  @Column()
  network?: string;

  @Column()
  country?: string;

  @Column()
  language?: string;

  @Column()
  airedAt?: Date;

  @Column()
  year?: number;

  @Column("json", { array: true })
  genres?: string[];

  @Column()
  rating?: number;

  @Column()
  contentRating?: string;

  @Column({ default: false })
  updated: boolean;

  @Column()
  guid?: string;

  @Column()
  overseerrId?: number;

  @Column("enum", {
    enum: MediaItemState,
  })
  lastState: MediaItemState;

  @ManyToMany("FileSystemEntry", (entry: FileSystemEntry) => entry.id)
  filesystemEntries: Relation<FileSystemEntry>[];

  @ManyToMany(() => SubtitleEntry)
  subtitles: Relation<SubtitleEntry>[];

  @Column({ default: 0 })
  failedAttempts: number;
}

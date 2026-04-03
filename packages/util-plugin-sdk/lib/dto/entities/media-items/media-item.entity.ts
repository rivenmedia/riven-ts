import {
  Collection,
  type Hidden,
  type Opt,
  OptionalProps,
  type Ref,
} from "@mikro-orm/core";
import {
  Enum,
  Index,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/es";
import { DateTime } from "luxon";

import { MediaItemContentRating } from "../../enums/content-ratings.enum.ts";
import { MediaItemState } from "../../enums/media-item-state.enum.ts";
import { MediaItemType } from "../../enums/media-item-type.enum.ts";
import { FileSystemEntry } from "../filesystem/filesystem-entry.entity.ts";
import { SubtitleEntry } from "../filesystem/subtitle-entry.entity.ts";
import { ItemRequest, MediaEntry } from "../index.ts";
import { Stream } from "../streams/stream.entity.ts";

import type { Promisable } from "type-fest";

@Index({ properties: ["type", "releaseDate"] })
export abstract class MediaItem {
  [OptionalProps]?: "state";

  @PrimaryKey()
  id!: number;

  @Index()
  @Property()
  title!: string;

  @Property()
  fullTitle!: Opt<string>;

  @Property()
  imdbId?: string | null;

  @Property()
  tvdbId?: string | null;

  @Property()
  tmdbId?: string | null;

  @Property()
  posterPath?: string | null;

  @Index()
  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Property({ onUpdate: () => DateTime.now().toJSDate() })
  updatedAt?: Opt<Date> | null;

  @Property()
  indexedAt?: Date | null;

  @Property()
  scrapedAt?: Date | null;

  @Property({ default: 0 })
  scrapedTimes!: Opt<number>;

  @Property({ nullable: true, type: "json" })
  aliases?: Record<string, string[]> | null;

  @Property({ persist: false, hidden: true })
  get isAnime(): Opt<Hidden<boolean>> {
    return (
      this.language !== "en" &&
      ["animation", "anime"].every((genre) =>
        this.genres?.map((g) => g.toLowerCase()).includes(genre),
      )
    );
  }

  @Property()
  network?: string | null;

  @Property()
  @Property()
  country?: string | null;

  @Property()
  language?: string | null;

  @Property()
  releaseDate!: Date | null;

  @Property()
  year?: number | null;

  @Property()
  genres?: string[] | null;

  @Property()
  rating?: number | null;

  @Enum(() => MediaItemContentRating.enum)
  contentRating?: MediaItemContentRating | null;

  @Property()
  guid?: string | null;

  @Enum({
    default: MediaItemState.enum.indexed,
    items: () => MediaItemState.enum,
  })
  state!: MediaItemState;

  @Property()
  failedAttempts: Opt<number> = 0;

  @ManyToMany()
  filesystemEntries: Collection<FileSystemEntry> =
    new Collection<FileSystemEntry>(this);

  @ManyToMany()
  subtitles: Collection<SubtitleEntry> = new Collection<SubtitleEntry>(this);

  @ManyToOne()
  activeStream?: Ref<Stream> | null;

  @ManyToMany()
  streams: Collection<Stream> = new Collection<Stream>(this);

  @ManyToMany()
  blacklistedStreams: Collection<Stream> = new Collection<Stream>(this);

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
}

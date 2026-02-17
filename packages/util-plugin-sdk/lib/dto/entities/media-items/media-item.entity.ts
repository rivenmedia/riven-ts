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
} from "@mikro-orm/core";
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { DateTime } from "luxon";
import { Field, ID, ObjectType } from "type-graphql";

import {
  MediaItemContentRating,
  MediaItemContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaItemState } from "../../enums/media-item-state.enum.ts";
import { MediaItemType } from "../../enums/media-item-type.enum.ts";
import { FileSystemEntry } from "../filesystem/filesystem-entry.entity.ts";
import { SubtitleEntry } from "../filesystem/subtitle-entry.entity.ts";
import { Episode, type MediaEntry, Movie } from "../index.ts";
import { Stream } from "../streams/stream.entity.ts";

@ObjectType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
@Index({ properties: ["type", "airedAt"] })
export abstract class MediaItem {
  @Field((_type) => ID)
  @PrimaryKey()
  id!: Opt<number>;

  @Field(() => String)
  @Index()
  @Property()
  title!: string;

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

  @Field(() => Number)
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
  airedAt?: Date | null;

  @Field(() => Number, { nullable: true })
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

  @Field(() => Boolean)
  @Property({ default: false })
  updated!: Opt<boolean>;

  @Field(() => String, { nullable: true })
  @Property()
  guid?: string | null;

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
  activeStream?: Ref<Stream> | null;

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
  abstract get prettyName(): Opt<Hidden<string>>;

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
    if (!(this instanceof Movie) && !(this instanceof Episode)) {
      return;
    }

    return this.filesystemEntries
      .getItems()
      .find((entry) => entry.type === "media") as MediaEntry | undefined;
  }

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

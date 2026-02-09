import {
  Entity,
  Enum,
  type Hidden,
  ManyToOne,
  type Opt,
  PrimaryKey,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { IsPositive } from "class-validator";
import path from "node:path";
import { Field, ID, ObjectType } from "type-graphql";
import z from "zod";

import { Episode } from "../media-items/episode.entity.ts";
import { MediaItem } from "../media-items/media-item.entity.ts";
import { Movie } from "../media-items/movie.entity.ts";

export const FileSystemEntryType = z.enum(["media", "subtitle"]);

export type FileSystemEntryType = z.infer<typeof FileSystemEntryType>;

/**
 * Builds the path parts for a given media item, used for generating the VFS path for filesystem entries.
 *
 * @param mediaItem The media item associated with the filesystem entry.
 * @returns An array of strings to build the path.
 *
 * @throws {ReferenceError} if required properties are missing for path generation.
 * @throws {TypeError} if the media item type is unsupported. Only `Movie` and `Episode` have associated filesystem entries.
 */
function getMediaItemPathParts(mediaItem: MediaItem) {
  if (mediaItem instanceof Movie) {
    return [mediaItem.prettyName];
  }

  if (mediaItem instanceof Episode) {
    const seasonLabel = mediaItem.season.getProperty("prettyName");
    const showLabel = mediaItem.season
      .getProperty("parent")
      .getProperty("prettyName");

    if (!seasonLabel || !showLabel) {
      throw new ReferenceError("Unable to determine path - missing prettyName");
    }

    return [showLabel, seasonLabel];
  }

  throw new TypeError("Unsupported media item type for path generation");
}

@ObjectType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
  discriminatorMap: {
    media: "MediaEntry",
    subtitle: "SubtitleEntry",
  },
})
export abstract class FileSystemEntry {
  @Field((_type) => ID)
  @PrimaryKey()
  id!: Opt<number>;

  @Field()
  @Property({ type: "bigint" })
  @IsPositive()
  fileSize!: number;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = new Date();

  @Field(() => Date, { nullable: true })
  @Property({ onUpdate: () => new Date() })
  updatedAt?: Opt<Date>;

  @Field(() => MediaItem)
  @ManyToOne(() => MediaItem)
  mediaItem!: Ref<Movie | Episode>;

  @Field(() => String)
  @Enum(() => FileSystemEntryType.enum)
  type!: FileSystemEntryType;

  /**
   * The base directory for this media item, e.g. "movies" or "shows"
   */
  @Property({ persist: false, hidden: true })
  get baseDirectory(): Opt<Hidden<"movies" | "shows">> {
    const mediaItemType = this.mediaItem.getEntity().type;

    if (mediaItemType === "movie") {
      return "movies";
    }

    return "shows";
  }

  /**
   * The VFS file name for this entry
   *
   * @example "movie.mkv", "episode.srt"
   */
  abstract get vfsFileName(): Opt<Hidden<string>>;

  /**
   * The full path to this filesystem entry in the VFS
   *
   * @example "movies/Inception (2010) {tmdb-27205}/Inception (2010) {tmdb-27205}.mkv"
   */
  @Property({ persist: false, hidden: true })
  get path(): Opt<Hidden<string>> {
    return path.join(
      this.baseDirectory,
      ...getMediaItemPathParts(this.mediaItem.unwrap()).map(String),
      this.vfsFileName,
    );
  }
}

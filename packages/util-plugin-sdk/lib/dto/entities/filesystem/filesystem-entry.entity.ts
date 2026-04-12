import {
  BeforeCreate,
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { IsPositive } from "class-validator";
import { BigIntResolver } from "graphql-scalars";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";

import { Episode, MediaItem, Movie } from "../media-items/index.ts";

import type { Hidden, Opt, Ref } from "@mikro-orm/core";
import type { Promisable, ValueOf } from "type-fest";

export const FileSystemEntryType = {
  MEDIA: "media",
  SUBTITLE: "subtitle",
} as const;

export type FileSystemEntryType = ValueOf<typeof FileSystemEntryType>;

registerEnumType(FileSystemEntryType, {
  name: "FileSystemEntryType",
  description: "The type of the filesystem entry.",
  valuesConfig: {
    MEDIA: {
      description: "A media file, e.g. a movie or episode file.",
    },
    SUBTITLE: {
      description: "A subtitle file associated with a media file.",
    },
  },
});

/**
 * Builds the path parts for a given media item, used for generating the VFS path for filesystem entries.
 *
 * @param mediaItem The media item associated with the filesystem entry.
 * @returns An array of strings to build the path.
 *
 * @throws {ReferenceError} if required properties are missing for path generation.
 * @throws {TypeError} if the media item type is unsupported. Only `Movie` and `Episode` have associated filesystem entries.
 */
async function getMediaItemPathParts(mediaItem: MediaItem) {
  if (mediaItem instanceof Movie) {
    return [mediaItem.getPrettyName()];
  }

  if (mediaItem instanceof Episode) {
    const season = await mediaItem.season.loadOrFail({
      populate: ["show"],
    });

    const seasonLabel = season.getPrettyName();
    const showLabel = season.show.getEntity().getPrettyName();

    if (!seasonLabel || !showLabel) {
      throw new ReferenceError(
        "Unable to determine path - missing seasonLabel or showLabel",
      );
    }

    return [showLabel, seasonLabel];
  }

  throw new TypeError("Unsupported media item type for path generation");
}

@ObjectType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
export abstract class FileSystemEntry {
  @Field((_type) => ID)
  @PrimaryKey({ type: "uuid" })
  id = randomUUID();

  @Field(() => BigIntResolver)
  @Property({ type: "bigint" })
  @IsPositive()
  fileSize!: number;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property({ onUpdate: () => DateTime.now().toJSDate() })
  updatedAt?: Opt<Date>;

  @Field(() => MediaItem)
  @ManyToOne(() => MediaItem)
  mediaItem!: Opt<Ref<Movie | Episode>>;

  @Field(() => FileSystemEntryType)
  @Enum(() => FileSystemEntryType)
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
   * The full path to this filesystem entry in the VFS.
   *
   * @example "Inception (2010) {tmdb-27205}/Inception (2010) {tmdb-27205}.mkv"
   */
  @Property()
  path!: Opt<string>;

  /**
   * The VFS file name for this entry
   *
   * @example "movie.mkv", "episode.srt"
   */
  abstract getVfsFileName(): Promisable<string>;

  @BeforeCreate()
  async _setPath() {
    const mediaItem = this.mediaItem.getEntity();
    const pathParts = await getMediaItemPathParts(mediaItem);

    // Remove periods from path parts to avoid directories being parsed as files
    const sanitisedPathParts = pathParts.map((part) => part.replace(/\./g, ""));

    this.path = path.join(...sanitisedPathParts, await this.getVfsFileName());
  }
}

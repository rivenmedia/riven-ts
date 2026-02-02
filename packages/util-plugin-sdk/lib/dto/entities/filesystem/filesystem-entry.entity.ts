import {
  Entity,
  Enum,
  type Hidden,
  ManyToOne,
  PrimaryKey,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { IsPositive } from "class-validator";
import path from "node:path";
import { Field, ID, ObjectType } from "type-graphql";
import z from "zod";

import { MediaItem } from "../media-items/media-item.entity.ts";

export const FileSystemEntryType = z.enum(["media", "subtitle"]);

export type FileSystemEntryType = z.infer<typeof FileSystemEntryType>;

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
  id!: number;

  @Field(() => Number)
  @Property({ type: "bigint" })
  @IsPositive()
  fileSize!: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({ onUpdate: () => new Date() })
  updatedAt?: Date;

  @Field(() => MediaItem)
  @ManyToOne()
  mediaItem!: Ref<MediaItem>;

  @Field(() => String)
  @Enum(() => FileSystemEntryType.enum)
  type!: FileSystemEntryType;

  /**
   * The base directory for this media item, e.g. "movies" or "shows"
   */
  @Property({ persist: false, hidden: true })
  get baseDirectory(): Hidden<"movies" | "shows"> {
    switch (this.mediaItem.getProperty("type")) {
      case "episode":
      case "season":
      case "show":
        return "shows";
      case "movie":
        return "movies";
      case "requested_item":
        throw new Error("Requested items do not have a filesystem entry");
    }
  }

  /**
   * The VFS file name for this entry
   *
   * @example "movie.mkv", "episode.srt"
   */
  abstract get vfsFileName(): Hidden<string>;

  /**
   * The full path to this filesystem entry in the VFS
   *
   * @example "/mount/riven/movies/Inception (2010) {tmdb-27205}/Inception (2010) {tmdb-27205}.mkv"
   */
  @Property({ persist: false, hidden: true })
  get path(): Hidden<string> {
    const prettyName = this.mediaItem.getProperty("prettyName");

    if (!prettyName) {
      throw new ReferenceError("Unable to determine path - missing prettyName");
    }

    return path.join(this.baseDirectory, prettyName, this.vfsFileName);
  }
}
